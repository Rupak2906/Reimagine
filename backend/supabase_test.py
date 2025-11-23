import os
from supabase import create_client, Client

# Replace these with your actual values
SUPABASE_URL = "https://pabbnxaimlkcrawqfavj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYmJueGFpbWxrY3Jhd3FmYXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDg3ODcsImV4cCI6MjA3OTMyNDc4N30.0bda9zkTYuqr9PWJvpkzV-MSKr_CmWH-3zGS4t-Vt44"

# Or load from environment variables (recommended)
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def get_supabase_client() -> Client:
    """Create and return Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def test_connection():
    """Test Supabase connection by fetching one user."""
    
    supabase = get_supabase_client()
    
    print("="*60)
    print("SUPABASE CONNECTION TEST")
    print("="*60)
    
    # Fetch one user from personal_info table
    # Change 'personal_info' to your actual table name if different
    print("\n[1] Fetching from personal info table...")
    
    try:
        response = supabase.table("personal_info").select("*").limit(1).execute()
        
        if response.data:
            user = response.data[0]
            print(f"  ✓ Connection successful!")
            print(f"\n  User data:")
            for key, value in user.items():
                # Mask sensitive data
                if key in ["passwd", "password"]:
                    print(f"    {key}: ********")
                else:
                    print(f"    {key}: {value}")
        else:
            print("  ✓ Connection successful, but no users in table yet.")
            
    except Exception as e:
        print(f"  ✗ Error fetching personal_info: {e}")
        return
    
    # Fetch behavioral/KYC data for that user
    print("\n[2] Fetching behavioral/KYC data...")
    
    try:
        # Change 'behavioral_data' to your actual second table name
        # Using the user_id from the first query
        if response.data:
            user_id = response.data[0].get("id")
            
            kyc_response = supabase.table("behavioral_data").select("*").eq("id", user_id).execute()
            
            if kyc_response.data:
                print(f"  ✓ Found {len(kyc_response.data)} KYC records for user {user_id}")
                print(f"\n  KYC records:")
                for i, record in enumerate(kyc_response.data):
                    print(f"\n    Record {i+1}:")
                    for key, value in record.items():
                        print(f"      {key}: {value}")
            else:
                print(f"  No KYC data found for user {user_id}")
                
    except Exception as e:
        print(f"  ✗ Error fetching behavioral_data: {e}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)


def list_tables():
    """List available tables (requires appropriate permissions)."""
    supabase = get_supabase_client()
    
    print("\nAttempting to list tables...")
    print("Note: This may not work depending on your RLS policies.")
    
    # This queries the information schema - may require elevated permissions
    try:
        response = supabase.rpc('get_tables').execute()
        print(response)
    except Exception as e:
        print(f"Could not list tables: {e}")
        print("\nTry running test_connection() instead with your known table names.")


if __name__ == "__main__":
    print("\nBefore running, update SUPABASE_URL and SUPABASE_KEY in this file.")
    print("Then run: python supabase_test.py\n")
    
    # Uncomment the line below after adding your credentials
    test_connection()