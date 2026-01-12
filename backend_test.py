#!/usr/bin/env python3
"""
NoteForge AI Backend Testing Suite
Tests YouTube URL processing, file uploads, and text processing
"""

import requests
import json
import os
import time
from io import BytesIO

# Configuration
BASE_URL = "https://noteforge-audio.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_youtube_processing():
    """Test YouTube URL processing - Priority 1"""
    print("\n=== Testing YouTube URL Processing ===")
    
    # Test with a short YouTube video
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll - short video
    
    payload = {
        "youtubeUrl": test_url,
        "sourceType": "youtube"
    }
    
    try:
        print(f"Testing YouTube URL: {test_url}")
        print("Sending request to /api/process...")
        
        start_time = time.time()
        response = requests.post(
            f"{API_URL}/process",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=300  # 5 minutes timeout for YouTube processing
        )
        end_time = time.time()
        
        print(f"Response status: {response.status_code}")
        print(f"Processing time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ YouTube processing successful!")
            
            # Validate response structure
            if data.get('success') and 'data' in data:
                result = data['data']
                print(f"Title: {result.get('title', 'N/A')}")
                print(f"Source Type: {result.get('sourceType', 'N/A')}")
                print(f"Transcript length: {len(result.get('transcript', ''))}")
                
                # Check summaries
                summaries = result.get('summaries', {})
                print(f"Bullet Points: {'✅' if summaries.get('bulletPoints') else '❌'}")
                print(f"Topics: {'✅' if summaries.get('topics') else '❌'}")
                print(f"Key Takeaways: {'✅' if summaries.get('keyTakeaways') else '❌'}")
                print(f"Q&A: {'✅' if summaries.get('qa') else '❌'}")
                
                # Show sample transcript
                transcript = result.get('transcript', '')
                if transcript:
                    print(f"Sample transcript: {transcript[:200]}...")
                
                return True
            else:
                print("❌ Invalid response structure")
                print(f"Response: {data}")
                return False
        else:
            print(f"❌ YouTube processing failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ YouTube processing timed out (>5 minutes)")
        return False
    except Exception as e:
        print(f"❌ YouTube processing error: {str(e)}")
        return False

def test_text_processing():
    """Test text input processing - Priority 4"""
    print("\n=== Testing Text Processing ===")
    
    test_text = "Artificial intelligence is transforming education through personalized learning, automated grading, and intelligent tutoring systems. Machine learning algorithms can analyze student performance data to identify learning gaps and recommend targeted interventions. Natural language processing enables automated essay scoring and feedback generation."
    
    payload = {
        "text": test_text,
        "sourceType": "text"
    }
    
    try:
        print("Testing text summarization...")
        print(f"Input text length: {len(test_text)} characters")
        
        start_time = time.time()
        response = requests.post(
            f"{API_URL}/process",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        end_time = time.time()
        
        print(f"Response status: {response.status_code}")
        print(f"Processing time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Text processing successful!")
            
            if data.get('success') and 'data' in data:
                result = data['data']
                print(f"Title: {result.get('title', 'N/A')}")
                print(f"Source Type: {result.get('sourceType', 'N/A')}")
                
                # Check summaries
                summaries = result.get('summaries', {})
                print(f"Bullet Points: {'✅' if summaries.get('bulletPoints') else '❌'}")
                print(f"Topics: {'✅' if summaries.get('topics') else '❌'}")
                print(f"Key Takeaways: {'✅' if summaries.get('keyTakeaways') else '❌'}")
                print(f"Q&A: {'✅' if summaries.get('qa') else '❌'}")
                
                return True
            else:
                print("❌ Invalid response structure")
                return False
        else:
            print(f"❌ Text processing failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Text processing error: {str(e)}")
        return False

def create_test_audio_file():
    """Create a simple test audio file (WAV format)"""
    try:
        # Create a simple WAV file with silence (44 bytes header + 1 second of silence)
        wav_header = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        # Add 1 second of silence at 44.1kHz, 16-bit mono
        silence_data = b'\x00\x00' * 22050  # 1 second of silence
        wav_data = wav_header + silence_data
        
        return wav_data, "test_audio.wav"
    except Exception as e:
        print(f"Error creating test audio: {e}")
        return None, None

def test_audio_file_processing():
    """Test audio file upload processing - Priority 2"""
    print("\n=== Testing Audio File Processing ===")
    
    # Create a test audio file
    audio_data, filename = create_test_audio_file()
    if not audio_data:
        print("❌ Could not create test audio file")
        return False
    
    try:
        print(f"Testing audio file upload: {filename}")
        print(f"File size: {len(audio_data)} bytes")
        
        files = {
            'file': (filename, BytesIO(audio_data), 'audio/wav')
        }
        data = {
            'sourceType': 'audio'
        }
        
        start_time = time.time()
        response = requests.post(
            f"{API_URL}/process",
            files=files,
            data=data,
            timeout=120
        )
        end_time = time.time()
        
        print(f"Response status: {response.status_code}")
        print(f"Processing time: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Audio file processing successful!")
            
            if result.get('success') and 'data' in result:
                data = result['data']
                print(f"Title: {data.get('title', 'N/A')}")
                print(f"Source Type: {data.get('sourceType', 'N/A')}")
                print(f"Transcript: {data.get('transcript', 'N/A')}")
                
                # Check summaries
                summaries = data.get('summaries', {})
                print(f"Summaries generated: {'✅' if summaries else '❌'}")
                
                return True
            else:
                print("❌ Invalid response structure")
                return False
        else:
            print(f"❌ Audio processing failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Audio processing error: {str(e)}")
        return False

def test_invalid_youtube_url():
    """Test error handling for invalid YouTube URL"""
    print("\n=== Testing Invalid YouTube URL Handling ===")
    
    invalid_url = "https://www.youtube.com/watch?v=invalid_video_id_12345"
    
    payload = {
        "youtubeUrl": invalid_url,
        "sourceType": "youtube"
    }
    
    try:
        print(f"Testing invalid YouTube URL: {invalid_url}")
        
        response = requests.post(
            f"{API_URL}/process",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 500:
            print("✅ Invalid URL properly rejected with error")
            return True
        elif response.status_code == 200:
            print("⚠️ Invalid URL was processed (unexpected)")
            return False
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing invalid URL: {str(e)}")
        return False

def test_api_health():
    """Test basic API connectivity"""
    print("\n=== Testing API Health ===")
    
    try:
        # Test with a simple request to see if API is responding
        response = requests.get(f"{BASE_URL}", timeout=10)
        print(f"Frontend status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API health check failed: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("🚀 Starting NoteForge AI Backend Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"API URL: {API_URL}")
    
    results = {}
    
    # Test API health first
    results['api_health'] = test_api_health()
    
    # Test text processing (fastest)
    results['text_processing'] = test_text_processing()
    
    # Test audio file processing
    results['audio_processing'] = test_audio_file_processing()
    
    # Test YouTube processing (slowest)
    results['youtube_processing'] = test_youtube_processing()
    
    # Test error handling
    results['error_handling'] = test_invalid_youtube_url()
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST RESULTS SUMMARY")
    print("="*50)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️ Some tests failed - check logs above")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)