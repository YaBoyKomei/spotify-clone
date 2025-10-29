import requests
import json

def test_ai():
    print("🧪 Testing AI API...")
    
    url = "https://api.deepai.org/hacking_is_a_serious_crime"
    boundary = "----WebKitFormBoundary2EZaPVKzInbQDlEI"
    
    headers = {
        "Api-Key": "tryit-69244861019-9ebc4eeb1aa323e195fa7bb7a0fcc026",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
    }
    
    messages = [{"role": "user", "content": "Recommend 5 popular songs. Format each as: 'Song Title by Artist Name' on separate lines. Only provide song recommendations, nothing else."}]
    
    body = [
        f"--{boundary}",
        'Content-Disposition: form-data; name="chat_style"\r\n',
        "chat",
        f"--{boundary}",
        'Content-Disposition: form-data; name="chatHistory"\r\n',
        json.dumps(messages),
        f"--{boundary}",
        'Content-Disposition: form-data; name="model"\r\n',
        "standard",
        f"--{boundary}",
        'Content-Disposition: form-data; name="hacker_is_stinky"\r\n',
        "very_stinky",
        f"--{boundary}--"
    ]
    body_str = '\r\n'.join(body)
    
    try:
        response = requests.post(url, headers=headers, data=body_str, timeout=30)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("\n📝 Raw Response:")
            print(response.text[:500])
            print("\n")
            try:
                data = response.json()
                print("✅ Valid JSON")
                print(json.dumps(data, indent=2))
            except:
                print("❌ Not valid JSON, trying as text...")
                data = {"output": response.text}
            
            if "output" in data:
                print("\n🎵 Output text:")
                print(data["output"])
                
                print("\n🔍 Parsing songs...")
                lines = [line.strip() for line in data["output"].split('\n') if line.strip()]
                for i, line in enumerate(lines, 1):
                    print(f"  {i}. {line}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ai()
