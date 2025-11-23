import secrets
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import LoginAttemptRequest, RiskAssessmentResponse, RiskLevel
from risk_model import ImprovedRiskModel
from baseline_manager import BaselineManager


app = FastAPI(
    title="Login Risk Assessment API",
    description="ML-powered behavioral risk scoring with impersonation detection",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
risk_model = ImprovedRiskModel(model_path="./improved_model.pkl")
baseline_manager = BaselineManager(storage_path="./baselines")


def generate_session_token() -> str:
    """Generate a secure session token."""
    return secrets.token_urlsafe(32)


@app.post("/api/v1/assess", response_model=RiskAssessmentResponse)
async def assess_login_risk(request: LoginAttemptRequest):
    """
    Assess risk for a login attempt.
    
    Accepts behavioral data from frontend and returns:
    - risk_score (0-100)
    - risk_level (low/medium/high)
    - action (allow/step_up_auth/block)
    - flags (specific risk indicators detected)
    - session_token (if allowed or after step-up auth)
    """
    # Get user's baseline if exists
    baseline = baseline_manager.get_baseline(request.user_id)
    
    # Run risk assessment
    risk_score, risk_level, action, flags = risk_model.predict(request, baseline)
    
    # Generate session token only for low risk
    session_token = None
    if risk_level == RiskLevel.LOW:
        session_token = generate_session_token()
        # Update baseline with verified session
        baseline_manager.update_baseline(request.user_id, request, verified=True)
    
    return RiskAssessmentResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        action=action,
        flags=flags,
        session_token=session_token
    )


@app.post("/api/v1/verify-stepup", response_model=RiskAssessmentResponse)
async def verify_step_up_auth(
    request: LoginAttemptRequest,
    security_answer_correct: bool
):
    """
    Verify step-up authentication (security question).
    
    Called after user answers security question for medium-risk attempts.
    """
    if not security_answer_correct:
        return RiskAssessmentResponse(
            risk_score=100,
            risk_level=RiskLevel.HIGH,
            action="block",
            flags=["failed_security_question"],
            session_token=None
        )
    
    # Security question passed - allow access
    session_token = generate_session_token()
    
    # Update baseline with verified session
    baseline_manager.update_baseline(request.user_id, request, verified=True)
    
    return RiskAssessmentResponse(
        risk_score=35,  # Keep medium score but allow
        risk_level=RiskLevel.MEDIUM,
        action="allow",
        flags=["step_up_verified"],
        session_token=session_token
    )


@app.post("/api/v1/enroll")
async def enroll_user(request: LoginAttemptRequest):
    """
    Enroll a new user during onboarding.
    
    Creates initial behavioral baseline. Should be called
    during signup flow, not login.
    """
    existing = baseline_manager.get_baseline(request.user_id)
    
    if existing:
        # Update existing baseline
        baseline = baseline_manager.update_baseline(request.user_id, request, verified=True)
        return {
            "status": "updated",
            "user_id": request.user_id,
            "session_count": baseline.session_count,
            "baseline_reliable": baseline_manager.is_baseline_reliable(request.user_id)
        }
    
    # Create new baseline
    baseline = baseline_manager.create_baseline(request.user_id, request)
    
    return {
        "status": "created",
        "user_id": request.user_id,
        "session_count": baseline.session_count,
        "baseline_reliable": False  # Needs more sessions
    }


@app.get("/api/v1/baseline/{user_id}")
async def get_user_baseline(user_id: str):
    """
    Get user's baseline status (for debugging/admin).
    """
    baseline = baseline_manager.get_baseline(user_id)
    
    if not baseline:
        raise HTTPException(status_code=404, detail="Baseline not found")
    
    return {
        "user_id": user_id,
        "session_count": baseline.session_count,
        "baseline_reliable": baseline_manager.is_baseline_reliable(user_id),
        "created_at": baseline.created_at.isoformat(),
        "updated_at": baseline.updated_at.isoformat(),
        "known_devices": len(baseline.known_fingerprints),
        "known_countries": baseline.known_countries,
    }


@app.delete("/api/v1/baseline/{user_id}")
async def delete_user_baseline(user_id: str):
    """
    Delete user's baseline (for account deletion or reset).
    """
    deleted = baseline_manager.delete_baseline(user_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Baseline not found")
    
    return {"status": "deleted", "user_id": user_id}


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_trained": risk_model.is_trained,
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)