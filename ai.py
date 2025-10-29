import requests
import json
import logging
import time

logging.basicConfig(
    filename='chat_errors.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DeepAIClient:
    def __init__(self, api_key=None):
        self.api_key = api_key or "tryit-69244861019-9ebc4eeb1aa323e195fa7bb7a0fcc026"
        self.base_url = "https://api.deepai.org"
        self.headers = {
            "Api-Key": self.api_key,
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*"
        }

    def chat(self, messages, model="standard", chat_style="chat"):
        endpoint = "/hacking_is_a_serious_crime"
        url = f"{self.base_url}{endpoint}"
        boundary = "----WebKitFormBoundary2EZaPVKzInbQDlEI"

        headers = self.headers.copy()
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"

        body = [
            f"--{boundary}",
            'Content-Disposition: form-data; name="chat_style"\r\n',
            chat_style,
            f"--{boundary}",
            'Content-Disposition: form-data; name="chatHistory"\r\n',
            json.dumps(messages),
            f"--{boundary}",
            'Content-Disposition: form-data; name="model"\r\n',
            model,
            f"--{boundary}",
            'Content-Disposition: form-data; name="hacker_is_stinky"\r\n',
            "very_stinky",
            f"--{boundary}--"
        ]
        body_str = '\r\n'.join(body)

        try:
            response = requests.post(url, headers=headers, data=body_str, timeout=30)
            print(response.status_code)
            if response.status_code == 200:
                try:
                    return response.json()
                except ValueError:
                    return {"output": response.text.strip()}
            else:
                return {
                    "error": True,
                    "status": response.status_code,
                    "text": response.text[:200]
                }
        except Exception as e:
            logger.error(f"Chat request failed: {str(e)}")
            return {"error": True, "message": str(e)}
def chat(user_input):
    client = DeepAIClient()
    prompt = [
        {"role": "user", "content": user_input}
    ]

    intention = client.chat(prompt)
    words = intention.get("output", "").split()
    response = " ".join(words)
    response = response.replace(" ,", ",").replace(" .", ".").replace(" ?", "?").replace(" !", "!")
    print(response)

    return response
chat("hello")

