#!/usr/bin/env python3
"""
NoteForge AI Backend Testing Suite
Tests all backend API endpoints with GPT-4o-mini implementation
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "https://noteai-assist.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}s" if response_time > 0 else "N/A"
        }
        self.results.append(result)
        print(f"{status} | {test_name} | {details} | {result['response_time']}")
        
    def test_server_connectivity(self):
        """Test basic server connectivity"""
        try:
            start_time = time.time()
            response = requests.get(BASE_URL, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                self.log_result("Server Connectivity", True, "Server is responding", response_time)
                return True
            else:
                self.log_result("Server Connectivity", False, f"Server returned {response.status_code}", response_time)
                return False
        except Exception as e:
            self.log_result("Server Connectivity", False, f"Connection failed: {str(e)}")
            return False
    
    def test_text_processing(self):
        """Test text processing with GPT-4o-mini"""
        try:
            start_time = time.time()
            
            payload = {
                "text": "Artificial intelligence is transforming education. Machine learning algorithms can personalize learning experiences for students. Natural language processing helps in automated grading and feedback. Deep learning models can analyze student performance patterns and provide targeted recommendations.",
                "sourceType": "text"
            }
            
            response = requests.post(
                f"{API_BASE}/process",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=60
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    result_data = data["data"]
                    
                    # Check required fields
                    required_fields = ["transcript", "summaries", "sourceType"]
                    missing_fields = [field for field in required_fields if field not in result_data]
                    
                    if missing_fields:
                        self.log_result("Text Processing", False, f"Missing fields: {missing_fields}", response_time)
                        return False
                    
                    # Check summaries structure
                    summaries = result_data["summaries"]
                    required_summary_types = ["bulletPoints", "topics", "keyTakeaways", "qa"]
                    missing_summaries = [stype for stype in required_summary_types if stype not in summaries]
                    
                    if missing_summaries:
                        self.log_result("Text Processing", False, f"Missing summary types: {missing_summaries}", response_time)
                        return False
                    
                    # Check if summaries have content
                    empty_summaries = [stype for stype, content in summaries.items() if not content or len(content.strip()) < 10]
                    if empty_summaries:
                        self.log_result("Text Processing", False, f"Empty summaries: {empty_summaries}", response_time)
                        return False
                    
                    self.log_result("Text Processing", True, f"GPT-4o-mini generated all 4 summary types successfully", response_time)
                    return True
                else:
                    self.log_result("Text Processing", False, f"Invalid response structure: {data}", response_time)
                    return False
            else:
                error_text = response.text
                self.log_result("Text Processing", False, f"HTTP {response.status_code}: {error_text}", response_time)
                return False
                
        except Exception as e:
            self.log_result("Text Processing", False, f"Exception: {str(e)}")
            return False
    
    def test_youtube_processing(self):
        """Test YouTube URL processing"""
        try:
            start_time = time.time()
            
            # Using a short, well-known video that should work
            payload = {
                "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "sourceType": "youtube"
            }
            
            response = requests.post(
                f"{API_BASE}/process",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=180  # YouTube processing can take longer
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "data" in data:
                    result_data = data["data"]
                    
                    # Check YouTube-specific fields
                    youtube_fields = ["youtubeUrl", "videoId", "transcript", "summaries"]
                    missing_fields = [field for field in youtube_fields if field not in result_data]
                    
                    if missing_fields:
                        self.log_result("YouTube Processing", False, f"Missing YouTube fields: {missing_fields}", response_time)
                        return False
                    
                    # Check if transcript was generated
                    if not result_data["transcript"] or len(result_data["transcript"].strip()) < 10:
                        self.log_result("YouTube Processing", False, "No transcript generated from YouTube audio", response_time)
                        return False
                    
                    # Check summaries
                    summaries = result_data["summaries"]
                    if not all(summaries.get(stype) for stype in ["bulletPoints", "topics", "keyTakeaways", "qa"]):
                        self.log_result("YouTube Processing", False, "Incomplete summaries from YouTube content", response_time)
                        return False
                    
                    self.log_result("YouTube Processing", True, f"YouTube extraction + Whisper + GPT-4o-mini pipeline working", response_time)
                    return True
                else:
                    self.log_result("YouTube Processing", False, f"Invalid response: {data}", response_time)
                    return False
            else:
                error_text = response.text
                if "403" in error_text or "Forbidden" in error_text:
                    self.log_result("YouTube Processing", False, f"YouTube blocked request (403) - Expected in 2025: {error_text}", response_time)
                    return False
                else:
                    self.log_result("YouTube Processing", False, f"HTTP {response.status_code}: {error_text}", response_time)
                    return False
                
        except Exception as e:
            self.log_result("YouTube Processing", False, f"Exception: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test API error handling"""
        test_cases = [
            {
                "name": "Empty Text",
                "payload": {"text": "", "sourceType": "text"},
                "expected_error": True
            },
            {
                "name": "Invalid YouTube URL", 
                "payload": {"youtubeUrl": "https://invalid-url.com", "sourceType": "youtube"},
                "expected_error": True
            },
            {
                "name": "Missing Required Fields",
                "payload": {"sourceType": "text"},
                "expected_error": True
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            try:
                start_time = time.time()
                response = requests.post(
                    f"{API_BASE}/process",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=30
                )
                response_time = time.time() - start_time
                
                if test_case["expected_error"]:
                    if response.status_code >= 400:
                        self.log_result(f"Error Handling - {test_case['name']}", True, f"Correctly returned error {response.status_code}", response_time)
                    else:
                        self.log_result(f"Error Handling - {test_case['name']}", False, f"Should have returned error but got {response.status_code}", response_time)
                        all_passed = False
                else:
                    if response.status_code == 200:
                        self.log_result(f"Error Handling - {test_case['name']}", True, "Request processed successfully", response_time)
                    else:
                        self.log_result(f"Error Handling - {test_case['name']}", False, f"Unexpected error {response.status_code}", response_time)
                        all_passed = False
                        
            except Exception as e:
                self.log_result(f"Error Handling - {test_case['name']}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_api_response_structure(self):
        """Test API response structure consistency"""
        try:
            start_time = time.time()
            
            payload = {
                "text": "This is a test message for API structure validation.",
                "sourceType": "text"
            }
            
            response = requests.post(
                f"{API_BASE}/process",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Check top-level structure
                if not isinstance(data, dict) or "success" not in data or "data" not in data:
                    self.log_result("API Response Structure", False, "Invalid top-level response structure", response_time)
                    return False
                
                result_data = data["data"]
                
                # Check data structure
                expected_fields = ["title", "sourceType", "transcript", "summaries"]
                missing_fields = [field for field in expected_fields if field not in result_data]
                
                if missing_fields:
                    self.log_result("API Response Structure", False, f"Missing data fields: {missing_fields}", response_time)
                    return False
                
                # Check summaries structure
                summaries = result_data["summaries"]
                if not isinstance(summaries, dict):
                    self.log_result("API Response Structure", False, "Summaries should be a dictionary", response_time)
                    return False
                
                expected_summary_keys = ["bulletPoints", "topics", "keyTakeaways", "qa"]
                missing_summary_keys = [key for key in expected_summary_keys if key not in summaries]
                
                if missing_summary_keys:
                    self.log_result("API Response Structure", False, f"Missing summary keys: {missing_summary_keys}", response_time)
                    return False
                
                self.log_result("API Response Structure", True, "Response structure is consistent and complete", response_time)
                return True
            else:
                self.log_result("API Response Structure", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_result("API Response Structure", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 80)
        print("🧪 NoteForge AI Backend Testing Suite")
        print("Testing GPT-4o-mini implementation")
        print("=" * 80)
        print()
        
        # Test server connectivity first
        if not self.test_server_connectivity():
            print("\n❌ Server connectivity failed. Aborting tests.")
            return False
        
        print()
        
        # Run all tests
        tests = [
            ("API Response Structure", self.test_api_response_structure),
            ("Text Processing (GPT-4o-mini)", self.test_text_processing),
            ("Error Handling", self.test_error_handling),
            ("YouTube Processing", self.test_youtube_processing),
        ]
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running {test_name}...")
            try:
                test_func()
            except Exception as e:
                self.log_result(test_name, False, f"Test execution failed: {str(e)}")
            print()
        
        # Print summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        print()
        
        # Print detailed results
        print("📋 DETAILED RESULTS:")
        print("-" * 80)
        for result in self.results:
            print(f"{result['status']} | {result['test']:<30} | {result['details']:<40} | {result['response_time']}")
        
        print()
        
        # Determine overall status
        critical_tests = ["Server Connectivity", "Text Processing (GPT-4o-mini)", "API Response Structure"]
        critical_failures = [r for r in self.results if r['test'] in critical_tests and not r['success']]
        
        if critical_failures:
            print("❌ CRITICAL TESTS FAILED - Backend has major issues")
            return False
        elif self.passed_tests == self.total_tests:
            print("✅ ALL TESTS PASSED - Backend is fully functional")
            return True
        else:
            print("⚠️  SOME TESTS FAILED - Backend has minor issues but core functionality works")
            return True

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)