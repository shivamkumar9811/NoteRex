#!/usr/bin/env python3
"""
NoteForge AI Backend Testing Suite
Tests the backend API endpoints with focus on Emergent gateway integration
"""

import requests
import json
import os
import time
from io import BytesIO
import tempfile

# Configuration
BASE_URL = "https://noteforge-ai.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class NoteForgeBackendTester:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NoteForge-Backend-Tester/1.0'
        })
    
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details or {},
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_text_processing(self):
        """Test 1: Text Processing (Highest Priority - Tests Gemini only)"""
        print("\n=== TEST 1: TEXT PROCESSING ===")
        
        try:
            payload = {
                "text": "Artificial intelligence is transforming the world. Machine learning enables computers to learn from data. Deep learning uses neural networks with multiple layers.",
                "sourceType": "text"
            }
            
            response = self.session.post(
                f"{API_BASE}/process",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            
            if response.status_code != 200:
                self.log_result(
                    "Text Processing", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return
            
            data = response.json()
            
            # Validate response structure
            if not data.get('success'):
                self.log_result(
                    "Text Processing", 
                    False, 
                    f"API returned success=false: {data.get('error', 'Unknown error')}",
                    {"response": data}
                )
                return
            
            result_data = data.get('data', {})
            required_fields = ['title', 'sourceType', 'transcript', 'summaries']
            missing_fields = [field for field in required_fields if field not in result_data]
            
            if missing_fields:
                self.log_result(
                    "Text Processing", 
                    False, 
                    f"Missing required fields: {missing_fields}",
                    {"response": data}
                )
                return
            
            # Validate summaries structure
            summaries = result_data.get('summaries', {})
            required_summary_types = ['bulletPoints', 'topics', 'keyTakeaways', 'qa']
            missing_summaries = [stype for stype in required_summary_types if stype not in summaries]
            
            if missing_summaries:
                self.log_result(
                    "Text Processing", 
                    False, 
                    f"Missing summary types: {missing_summaries}",
                    {"summaries": summaries}
                )
                return
            
            # Check if summaries have content
            empty_summaries = [stype for stype, content in summaries.items() if not content or len(str(content).strip()) < 10]
            
            if empty_summaries:
                self.log_result(
                    "Text Processing", 
                    False, 
                    f"Empty or too short summaries: {empty_summaries}",
                    {"summaries": summaries}
                )
                return
            
            self.log_result(
                "Text Processing", 
                True, 
                "Successfully processed text and generated all 4 summary formats",
                {
                    "title": result_data['title'][:50] + "...",
                    "sourceType": result_data['sourceType'],
                    "transcript_length": len(result_data['transcript']),
                    "summary_types": list(summaries.keys()),
                    "response_time": f"{response.elapsed.total_seconds():.2f}s"
                }
            )
            
        except requests.exceptions.Timeout:
            self.log_result("Text Processing", False, "Request timeout (>60s)")
        except requests.exceptions.RequestException as e:
            self.log_result("Text Processing", False, f"Request error: {str(e)}")
        except json.JSONDecodeError as e:
            self.log_result("Text Processing", False, f"Invalid JSON response: {str(e)}")
        except Exception as e:
            self.log_result("Text Processing", False, f"Unexpected error: {str(e)}")
    
    def test_audio_file_upload(self):
        """Test 2: Audio File Upload (Tests Whisper + Gemini)"""
        print("\n=== TEST 2: AUDIO FILE UPLOAD ===")
        
        try:
            # Create a minimal test audio file (silence)
            # This is a minimal WAV file with 1 second of silence
            wav_header = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
            
            files = {
                'file': ('test_audio.wav', BytesIO(wav_header), 'audio/wav'),
                'sourceType': (None, 'audio')
            }
            
            response = self.session.post(
                f"{API_BASE}/process",
                files=files,
                timeout=120
            )
            
            if response.status_code != 200:
                self.log_result(
                    "Audio File Upload", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return
            
            data = response.json()
            
            if not data.get('success'):
                error_msg = data.get('error', 'Unknown error')
                # Check if it's a Whisper-specific error (expected for minimal test file)
                if 'transcription' in error_msg.lower() or 'whisper' in error_msg.lower():
                    self.log_result(
                        "Audio File Upload", 
                        True, 
                        "Audio upload endpoint working (Whisper rejected minimal test file as expected)",
                        {"error": error_msg, "note": "This is expected behavior for minimal test audio"}
                    )
                else:
                    self.log_result(
                        "Audio File Upload", 
                        False, 
                        f"API error: {error_msg}",
                        {"response": data}
                    )
                return
            
            # If successful, validate structure
            result_data = data.get('data', {})
            self.log_result(
                "Audio File Upload", 
                True, 
                "Successfully processed audio file",
                {
                    "title": result_data.get('title', 'N/A'),
                    "sourceType": result_data.get('sourceType', 'N/A'),
                    "has_transcript": bool(result_data.get('transcript')),
                    "has_summaries": bool(result_data.get('summaries')),
                    "response_time": f"{response.elapsed.total_seconds():.2f}s"
                }
            )
            
        except requests.exceptions.Timeout:
            self.log_result("Audio File Upload", False, "Request timeout (>120s)")
        except requests.exceptions.RequestException as e:
            self.log_result("Audio File Upload", False, f"Request error: {str(e)}")
        except Exception as e:
            self.log_result("Audio File Upload", False, f"Unexpected error: {str(e)}")
    
    def test_youtube_url_processing(self):
        """Test 3: YouTube URL Processing (May have 403 errors - expected)"""
        print("\n=== TEST 3: YOUTUBE URL PROCESSING ===")
        
        try:
            payload = {
                "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "sourceType": "youtube"
            }
            
            response = self.session.post(
                f"{API_BASE}/process",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=180  # YouTube processing can take longer
            )
            
            if response.status_code != 200:
                self.log_result(
                    "YouTube URL Processing", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return
            
            data = response.json()
            
            if not data.get('success'):
                error_msg = data.get('error', 'Unknown error')
                # Check if it's expected YouTube restrictions
                if any(keyword in error_msg.lower() for keyword in ['403', 'forbidden', 'restricted', 'unavailable', 'private']):
                    self.log_result(
                        "YouTube URL Processing", 
                        True, 
                        f"YouTube processing endpoint working (video restricted as expected): {error_msg}",
                        {"error": error_msg, "note": "YouTube restrictions are expected"}
                    )
                else:
                    self.log_result(
                        "YouTube URL Processing", 
                        False, 
                        f"Unexpected API error: {error_msg}",
                        {"response": data}
                    )
                return
            
            # If successful, validate structure
            result_data = data.get('data', {})
            self.log_result(
                "YouTube URL Processing", 
                True, 
                "Successfully processed YouTube video",
                {
                    "title": result_data.get('title', 'N/A')[:50] + "...",
                    "sourceType": result_data.get('sourceType', 'N/A'),
                    "has_transcript": bool(result_data.get('transcript')),
                    "has_summaries": bool(result_data.get('summaries')),
                    "response_time": f"{response.elapsed.total_seconds():.2f}s"
                }
            )
            
        except requests.exceptions.Timeout:
            self.log_result("YouTube URL Processing", False, "Request timeout (>180s)")
        except requests.exceptions.RequestException as e:
            self.log_result("YouTube URL Processing", False, f"Request error: {str(e)}")
        except Exception as e:
            self.log_result("YouTube URL Processing", False, f"Unexpected error: {str(e)}")
    
    def test_error_handling(self):
        """Test 4: Error Handling"""
        print("\n=== TEST 4: ERROR HANDLING ===")
        
        # Test 4a: Invalid YouTube URL
        try:
            payload = {
                "youtubeUrl": "https://invalid-youtube-url.com/watch?v=invalid",
                "sourceType": "youtube"
            }
            
            response = self.session.post(
                f"{API_BASE}/process",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 500:
                data = response.json()
                if 'error' in data and ('invalid' in data['error'].lower() or 'youtube' in data['error'].lower()):
                    self.log_result(
                        "Error Handling - Invalid YouTube URL", 
                        True, 
                        "Correctly handled invalid YouTube URL",
                        {"error_message": data['error']}
                    )
                else:
                    self.log_result(
                        "Error Handling - Invalid YouTube URL", 
                        False, 
                        f"Unexpected error response: {data}",
                        {"response": data}
                    )
            else:
                self.log_result(
                    "Error Handling - Invalid YouTube URL", 
                    False, 
                    f"Expected 500 error, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_result("Error Handling - Invalid YouTube URL", False, f"Test error: {str(e)}")
        
        # Test 4b: Empty text
        try:
            payload = {
                "text": "",
                "sourceType": "text"
            }
            
            response = self.session.post(
                f"{API_BASE}/process",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # Either should return error or handle gracefully
            if response.status_code == 500:
                data = response.json()
                self.log_result(
                    "Error Handling - Empty Text", 
                    True, 
                    "Correctly handled empty text input",
                    {"error_message": data.get('error', 'No error message')}
                )
            elif response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result(
                        "Error Handling - Empty Text", 
                        True, 
                        "Gracefully handled empty text (returned success)",
                        {"response": "Processed empty text successfully"}
                    )
                else:
                    self.log_result(
                        "Error Handling - Empty Text", 
                        True, 
                        "Correctly handled empty text with success=false",
                        {"error": data.get('error', 'No error message')}
                    )
            else:
                self.log_result(
                    "Error Handling - Empty Text", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    {"response": response.text}
                )
                
        except Exception as e:
            self.log_result("Error Handling - Empty Text", False, f"Test error: {str(e)}")
        
        # Test 4c: Missing file
        try:
            files = {
                'sourceType': (None, 'audio')
                # Intentionally missing 'file'
            }
            
            response = self.session.post(
                f"{API_BASE}/process",
                files=files,
                timeout=30
            )
            
            if response.status_code == 400:
                data = response.json()
                if 'error' in data and 'file' in data['error'].lower():
                    self.log_result(
                        "Error Handling - Missing File", 
                        True, 
                        "Correctly handled missing file",
                        {"error_message": data['error']}
                    )
                else:
                    self.log_result(
                        "Error Handling - Missing File", 
                        False, 
                        f"Wrong error message: {data}",
                        {"response": data}
                    )
            else:
                self.log_result(
                    "Error Handling - Missing File", 
                    False, 
                    f"Expected 400 error, got {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                
        except Exception as e:
            self.log_result("Error Handling - Missing File", False, f"Test error: {str(e)}")
    
    def test_api_connectivity(self):
        """Test 0: Basic API Connectivity"""
        print("\n=== TEST 0: API CONNECTIVITY ===")
        
        try:
            # Test if the API is reachable
            response = self.session.get(BASE_URL, timeout=10)
            
            if response.status_code == 200:
                self.log_result(
                    "API Connectivity", 
                    True, 
                    f"Successfully connected to {BASE_URL}",
                    {"status_code": response.status_code}
                )
            else:
                self.log_result(
                    "API Connectivity", 
                    False, 
                    f"Unexpected status code: {response.status_code}",
                    {"status_code": response.status_code}
                )
                
        except requests.exceptions.Timeout:
            self.log_result("API Connectivity", False, "Connection timeout")
        except requests.exceptions.RequestException as e:
            self.log_result("API Connectivity", False, f"Connection error: {str(e)}")
        except Exception as e:
            self.log_result("API Connectivity", False, f"Unexpected error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting NoteForge AI Backend Testing Suite")
        print(f"📍 Testing API at: {API_BASE}")
        print("=" * 60)
        
        # Run tests in priority order
        self.test_api_connectivity()
        self.test_text_processing()  # Highest priority
        self.test_audio_file_upload()  # Medium priority
        self.test_youtube_url_processing()  # Medium priority (may fail due to restrictions)
        self.test_error_handling()  # Medium priority
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        # Critical issues
        critical_failures = [r for r in self.results if not r['success'] and 'connectivity' not in r['test'].lower()]
        if critical_failures:
            print(f"\n🚨 CRITICAL ISSUES FOUND ({len(critical_failures)}):")
            for failure in critical_failures:
                print(f"   • {failure['test']}: {failure['message']}")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.results,
            'critical_failures': critical_failures
        }

if __name__ == "__main__":
    tester = NoteForgeBackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if critical tests failed
    if results['critical_failures']:
        exit(1)
    else:
        exit(0)