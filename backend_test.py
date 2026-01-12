#!/usr/bin/env python3
"""
NoteForge AI Backend Testing Suite
Tests official OpenAI and Google Gemini API integration
"""

import requests
import json
import time
import os
from typing import Dict, Any

# Get base URL from environment
BASE_URL = "https://noteai-assist.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_text_processing():
    """Test 1: Text Processing (Highest Priority - Fastest to Test)"""
    print("\n" + "="*60)
    print("TEST 1: TEXT PROCESSING (GEMINI API)")
    print("="*60)
    
    try:
        # Test data - realistic content about AI
        test_text = """
        Artificial intelligence is transforming how we work and learn. Machine learning algorithms can now process vast amounts of data to identify patterns and make predictions. Deep learning, a subset of machine learning, has enabled breakthrough advances in computer vision and natural language processing.

        Neural networks, inspired by the human brain, consist of interconnected nodes that process information. These networks can learn from examples and improve their performance over time. Applications include image recognition, speech synthesis, language translation, and autonomous vehicles.

        The future of AI promises even more sophisticated systems that can understand context, reason about complex problems, and collaborate with humans in meaningful ways.
        """
        
        payload = {
            "text": test_text.strip(),
            "sourceType": "text"
        }
        
        print(f"📤 Sending POST request to: {API_BASE}/process")
        print(f"📝 Text length: {len(test_text)} characters")
        
        start_time = time.time()
        response = requests.post(
            f"{API_BASE}/process",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=60
        )
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f} seconds")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: Text processing completed")
            
            # Validate response structure
            if data.get('success') and 'data' in data:
                result_data = data['data']
                
                # Check required fields
                required_fields = ['title', 'sourceType', 'transcript', 'summaries']
                missing_fields = [field for field in required_fields if field not in result_data]
                
                if missing_fields:
                    print(f"❌ MISSING FIELDS: {missing_fields}")
                    return False
                
                # Check summaries structure
                summaries = result_data.get('summaries', {})
                required_summary_fields = ['bulletPoints', 'topics', 'keyTakeaways', 'qa']
                missing_summary_fields = [field for field in required_summary_fields if not summaries.get(field)]
                
                if missing_summary_fields:
                    print(f"❌ MISSING SUMMARY FIELDS: {missing_summary_fields}")
                    return False
                
                # Validate content quality
                print(f"📋 Title: {result_data['title'][:50]}...")
                print(f"📄 Source Type: {result_data['sourceType']}")
                print(f"📝 Transcript Length: {len(result_data['transcript'])} chars")
                
                for field in required_summary_fields:
                    content = summaries[field]
                    print(f"📊 {field}: {len(content)} chars - {'✅' if len(content) > 10 else '❌'}")
                
                print("✅ ALL FIELDS PRESENT AND NON-EMPTY")
                return True
            else:
                print(f"❌ INVALID RESPONSE STRUCTURE: {data}")
                return False
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: Request took longer than 60 seconds")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_youtube_processing():
    """Test 2: YouTube URL Processing"""
    print("\n" + "="*60)
    print("TEST 2: YOUTUBE URL PROCESSING (WHISPER + GEMINI)")
    print("="*60)
    
    try:
        # Use a short, well-known video for testing
        youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        
        payload = {
            "youtubeUrl": youtube_url,
            "sourceType": "youtube"
        }
        
        print(f"📤 Sending POST request to: {API_BASE}/process")
        print(f"🎥 YouTube URL: {youtube_url}")
        print("⚠️  Note: This may take 30-180 seconds for transcription...")
        
        start_time = time.time()
        response = requests.post(
            f"{API_BASE}/process",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=300  # 5 minutes for YouTube processing
        )
        end_time = time.time()
        
        print(f"⏱️  Response time: {end_time - start_time:.2f} seconds")
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: YouTube processing completed")
            
            # Validate response structure
            if data.get('success') and 'data' in data:
                result_data = data['data']
                
                # Check required fields for YouTube
                required_fields = ['title', 'sourceType', 'youtubeUrl', 'videoId', 'transcript', 'summaries']
                missing_fields = [field for field in required_fields if field not in result_data]
                
                if missing_fields:
                    print(f"❌ MISSING FIELDS: {missing_fields}")
                    return False
                
                # Check summaries structure
                summaries = result_data.get('summaries', {})
                required_summary_fields = ['bulletPoints', 'topics', 'keyTakeaways', 'qa']
                missing_summary_fields = [field for field in required_summary_fields if not summaries.get(field)]
                
                if missing_summary_fields:
                    print(f"❌ MISSING SUMMARY FIELDS: {missing_summary_fields}")
                    return False
                
                # Validate YouTube-specific content
                print(f"📋 Title: {result_data['title']}")
                print(f"📄 Source Type: {result_data['sourceType']}")
                print(f"🎥 YouTube URL: {result_data['youtubeUrl']}")
                print(f"🆔 Video ID: {result_data['videoId']}")
                print(f"📝 Transcript Length: {len(result_data['transcript'])} chars")
                
                # Validate video ID extraction
                expected_video_id = "dQw4w9WgXcQ"
                if result_data['videoId'] != expected_video_id:
                    print(f"❌ VIDEO ID MISMATCH: Expected {expected_video_id}, got {result_data['videoId']}")
                    return False
                
                # Check transcript quality
                if len(result_data['transcript']) < 10:
                    print("❌ TRANSCRIPT TOO SHORT - Whisper transcription may have failed")
                    return False
                
                for field in required_summary_fields:
                    content = summaries[field]
                    print(f"📊 {field}: {len(content)} chars - {'✅' if len(content) > 10 else '❌'}")
                
                print("✅ ALL YOUTUBE FIELDS PRESENT AND VALID")
                return True
            else:
                print(f"❌ INVALID RESPONSE STRUCTURE: {data}")
                return False
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: YouTube processing took longer than 5 minutes")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_error_handling():
    """Test 3: Error Handling"""
    print("\n" + "="*60)
    print("TEST 3: ERROR HANDLING")
    print("="*60)
    
    try:
        # Test invalid YouTube URL
        print("🧪 Testing invalid YouTube URL...")
        payload = {
            "youtubeUrl": "https://invalid-url.com/watch?v=invalid",
            "sourceType": "youtube"
        }
        
        response = requests.post(
            f"{API_BASE}/process",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 500:
            data = response.json()
            if 'error' in data and 'YouTube' in data['error']:
                print("✅ SUCCESS: Invalid YouTube URL properly rejected")
            else:
                print(f"❌ UNEXPECTED ERROR MESSAGE: {data}")
                return False
        else:
            print(f"❌ EXPECTED 500 ERROR, GOT: {response.status_code}")
            return False
        
        # Test missing content
        print("🧪 Testing empty request...")
        response = requests.post(
            f"{API_BASE}/process",
            headers={"Content-Type": "application/json"},
            json={},
            timeout=30
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 400:
            print("✅ SUCCESS: Empty request properly rejected")
        else:
            print(f"❌ EXPECTED 400 ERROR, GOT: {response.status_code}")
            return False
        
        print("✅ ERROR HANDLING WORKING CORRECTLY")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def test_api_connectivity():
    """Test 0: Basic API Connectivity"""
    print("\n" + "="*60)
    print("TEST 0: API CONNECTIVITY")
    print("="*60)
    
    try:
        print(f"📤 Testing connectivity to: {API_BASE}")
        
        # Test with a simple invalid endpoint to check if server is running
        response = requests.get(f"{API_BASE}/health", timeout=10)
        
        # We expect 404 for /health, but that means server is running
        if response.status_code == 404:
            print("✅ SUCCESS: API server is running and responding")
            return True
        elif response.status_code == 200:
            print("✅ SUCCESS: API server is running")
            return True
        else:
            print(f"⚠️  Server responding with status: {response.status_code}")
            return True  # Server is responding, that's what matters
            
    except requests.exceptions.ConnectionError:
        print(f"❌ FAILED: Cannot connect to {API_BASE}")
        return False
    except requests.exceptions.Timeout:
        print("❌ FAILED: Connection timeout")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests in priority order"""
    print("🚀 NOTEFORGE AI BACKEND TESTING SUITE")
    print("Testing Official OpenAI + Google Gemini API Integration")
    print(f"🌐 Base URL: {BASE_URL}")
    print(f"🔗 API Base: {API_BASE}")
    
    tests = [
        ("API Connectivity", test_api_connectivity),
        ("Text Processing (Gemini)", test_text_processing),
        ("YouTube Processing (Whisper + Gemini)", test_youtube_processing),
        ("Error Handling", test_error_handling),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ CRITICAL ERROR in {test_name}: {str(e)}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n📈 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Official API integration working correctly!")
    else:
        print("⚠️  Some tests failed - Check individual test results above")
    
    return results

if __name__ == "__main__":
    run_all_tests()