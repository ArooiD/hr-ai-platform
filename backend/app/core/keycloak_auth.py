"""Keycloak JWT token validation"""
import os
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
import requests

# Configuration from environment
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "hr-ai")
JWT_SECRET = os.getenv("JWT_SECRET", "hr-ai-dev-local-key")
JWT_ISSUER = os.getenv("JWT_ISSUER", "hr-ai-platform")


def get_keycloak_public_key() -> Optional[str]:
    """
    Get public key from Keycloak for JWT verification
    """
    try:
        # Try to get key from Keycloak well-known endpoint
        well_known_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/.well-known/openid-configuration"
        response = requests.get(well_known_url, timeout=10)
        
        if response.status_code == 200:
            config = response.json()
            jwks_url = config.get("jwks_uri")
            
            if jwks_url:
                jwks_response = requests.get(jwks_url, timeout=10)
                if jwks_response.status_code == 200:
                    jwks = jwks_response.json()
                    # For now, return None to use secret-based verification
                    # In production, implement proper JWKS key extraction
                    return None
        
        return None
    except Exception as e:
        print(f"Warning: Could not fetch Keycloak public key: {e}")
        return None


def verify_keycloak_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify Keycloak JWT token and return decoded payload
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload with user info
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # First, try to verify with secret (for development)
        # In production, use public key from Keycloak
        public_key = get_keycloak_public_key()
        
        if public_key:
            # Verify with public key (production)
            algorithms = ["RS256"]
            options = {
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": True,
            }
            payload = jwt.decode(
                token,
                public_key,
                algorithms=algorithms,
                options=options,
                issuer=f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}"
            )
        else:
            # Verify with secret (development mode)
            algorithms = ["HS256"]
            options = {
                "verify_signature": True,
                "verify_exp": True,
                "verify_aud": False,  # Disable audience verification in dev
            }
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=algorithms,
                options=options,
                issuer=JWT_ISSUER
            )
        
        return payload
        
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def extract_user_from_token(token: str) -> Dict[str, Any]:
    """
    Extract user information from Keycloak token
    
    Args:
        token: JWT token string
        
    Returns:
        User info dictionary compatible with existing auth system
    """
    payload = verify_keycloak_token(token)
    
    # Map Keycloak payload to our user format
    return {
        "id": payload.get("sub"),
        "username": payload.get("preferred_username"),
        "email": payload.get("email"),
        "name": f"{payload.get('given_name', '')} {payload.get('family_name', '')}".strip(),
        "roles": payload.get("roles", []),
        "realm_access": payload.get("realm_access", {}),
        "resource_access": payload.get("resource_access", {}),
    }
