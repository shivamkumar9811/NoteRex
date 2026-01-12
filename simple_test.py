#!/usr/bin/env python3
"""
Simple API connectivity test for NoteForge AI
"""

import requests
import json

# Configuration
BASE_URL = "https://noteai-assist.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_basic_connectivity():
    """Test basic API connectivity"""
    print("=== Testing Basic API Connectivity ===")
    
    try:
        # Test frontend
        response = requests.get(BASE_URL, timeout=10)
        print(f"Frontend status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Connectivity test failed: {str(e)}")
        return False

def test_simple_text_request():
    """Test with minimal text input"""
    print("\n=== Testing Simple Text Request ===")
    
    payload = {
        "text": "Hello world",
        "sourceType": "text"
    }
    
    try:
        print("Testing minimal text input...")
        
        response = requests.post(
            f"{API_URL}/process",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response text: {response.text[:500]}...")
        
        if response.status_code == 200:
            print("✅ Basic text processing works!")
            return True
        else:
            print(f"❌ Text processing failed")
            return False
            
    except Exception as e:
        print(f"❌ Text processing error: {str(e)}")
        return False

def main():
    """Run basic tests"""
    print("🔍 Running Basic API Tests")
    
    # Test connectivity
    connectivity_ok = test_basic_connectivity()
    
    if connectivity_ok:
        # Test simple text processing
        text_ok = test_simple_text_request()
    else:
        text_ok = False
    
    print(f"\n📊 Results:")
    print(f"Connectivity: {'✅' if connectivity_ok else '❌'}")
    print(f"Text Processing: {'✅' if text_ok else '❌'}")
    
    return connectivity_ok and text_ok

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)