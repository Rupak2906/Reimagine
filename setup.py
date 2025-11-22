"""
Setup script for fraud_ml package.
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text() if readme_file.exists() else ""

setup(
    name="fraud_ml",
    version="0.1.0",
    author="Fraud Detection Team",
    author_email="team@fraudml.example.com",
    description="ML fraud risk engine for credit card entry attempts",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourteam/fraud_ml",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.11",
    install_requires=[
        "scikit-learn>=1.3.0",
        "xgboost>=2.0.0",
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "shap>=0.44.0",
        "pydantic>=2.0.0",
        "joblib>=1.3.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "fraud-ml-train=fraud_ml.train:main",
            "fraud-ml-test=fraud_ml.inference:test_inference",
        ],
    },
)
