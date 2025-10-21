import requests
import json

# Headers for the request
headers = {
    'Host': 'music.youtube.com',
    'Cookie': 'VISITOR_INFO1_LIVE=XXi86JNt09c; VISITOR_PRIVACY_METADATA=CgJJThIEGgAgMw%3D%3D; VISITOR_INFO1_LIVE=XXi86JNt09c; VISITOR_PRIVACY_METADATA=CgJJThIEGgAgMw%3D%3D; PREF=tz=Asia.Calcutta&f7=100&f6=40000000; YSC=4rsqCoNLkxI; __Secure-ROLLOUT_TOKEN=CIfLptjqy7SvGhDt8Y3MnYuQAxiTlKXm-rWQAw%3D%3D; YSC=B-Xbb8lVHyQ',
    'Sec-Ch-Ua-Full-Version-List': '"Not?A_Brand";v="8.0.0.0", "Chromium";v="141.0.7390.108", "Google Chrome";v="141.0.7390.108"',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Ch-Ua': '"Not?A_Brand";v="8", "Chromium";v="141", "Google Chrome";v="141"',
    'Sec-Ch-Ua-Bitness': '"64"',
    'Sec-Ch-Ua-Model': '""',
    'Sec-Ch-Ua-Mobile': '?0',
    'X-Youtube-Client-Name': '67',
    'Sec-Ch-Ua-Wow64': '?0',
    'Sec-Ch-Ua-Form-Factors': '"Desktop"',
    'X-Youtube-Client-Version': '1.20251015.03.00',
    'Sec-Ch-Ua-Arch': '"x86"',
    'Sec-Ch-Ua-Full-Version': '"141.0.7390.108"',
    'Content-Type': 'application/json',
    'X-Youtube-Bootstrap-Logged-In': 'false',
    'X-Goog-Visitor-Id': 'CgtYWGk4NkpOdDA5YyjJ1N_HBjIKCgJJThIEGgAgMw%3D%3D',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Sec-Ch-Ua-Platform-Version': '"19.0.0"',
    'Accept': '*/*',
    'Origin': 'https://music.youtube.com',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'same-origin',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://music.youtube.com/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9,en-IN;q=0.8',
    'Priority': 'u=1, i'
}

# Request payload
payload = {
    "context": {
        "client": {
            "hl": "en",
            "gl": "IN",
            "remoteHost": "157.48.215.29",
            "deviceMake": "",
            "deviceModel": "",
            "visitorData": "CgtYWGk4NkpOdDA5YyjJ1N_HBjIKCgJJThIEGgAgMw%3D%3D",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36,gzip(gfe)",
            "clientName": "WEB_REMIX",
            "clientVersion": "1.20251015.03.00",
            "osName": "Windows",
            "osVersion": "10.0",
            "originalUrl": "https://music.youtube.com/",
            "platform": "DESKTOP",
            "clientFormFactor": "UNKNOWN_FORM_FACTOR",
            "configInfo": {
                "appInstallData": "CMnU38cGENqK0BwQlP6wBRCVsYATEImwzhwQvbauBRDM364FEJuI0BwQre_PHBCBzc4cEIvrzxwQt-TPHBCM6c8cEODpzxwQlPLPHBDa984cELvZzhwQmZixBRC52c4cEJ3QsAUQhJHQHBC36v4SEJr2zxwQ0bGAExDy6M8cEMXDzxwQm5HQHBDnldAcEMf3zxwQuOTOHBCu1s8cEN7pzxwQk4PQHBD8ss4cEIGU0BwQndfPHBDAj9AcENPhrwUQuPbPHBD2q7AFEPr_zxwQvYqwBRDJ968FEJbbzxwQmY2xBRCttYATEOK4sAUQxILQHBDhjtAcEIv3zxwQvZmwBRDevM4cEJX3zxwQ8J3PHBDni9AcEMzrzxwQiIewBRDvkdAcEPCcsAUQ4rjPHBCYuc8cEK-GzxwQh6zOHBDPjdAcKjxDQU1TS1JVaS1acS1ETWVVRXF2ZThBc3l2MV9wMVFVRHpmOEZrRk9KTktJdXBHS3RjZW9uOXdfUUZSMEgwAA%3D%3D",
                "coldConfigData": "CMnU38cGGjJBT2pGb3gzOFpQaVpLQldacjhiaUdZVVpFMFc1bXJpUnh3OGduM1NhSDJWM1Iybm5qQSIyQU9qRm94MzhaUGlaS0JXWnI4YmlHWVVaRTBXNW1yaVJ4dzhnbjNTYUgyVjNSMm5uakE%3D",
                "coldHashData": "CMnU38cGEhM4MzcyMjg4Nzg1MDY2MDg0NzkyGMnU38cGMjJBT2pGb3gzOFpQaVpLQldacjhiaUdZVVpFMFc1bXJpUnh3OGduM1NhSDJWM1Iybm5qQToyQU9qRm94MzhaUGlaS0JXWnI4YmlHWVVaRTBXNW1yaVJ4dzhnbjNTYUgyVjNSMm5uakE%3D",
                "hotHashData": "CMnU38cGEhQxODExMjI5MjU4MDk4MDU5MzAxNBjJ1N_HBjIyQU9qRm94MzhaUGlaS0JXWnI4YmlHWVVaRTBXNW1yaVJ4dzhnbjNTYUgyVjNSMm5uakE6MkFPakZveDM4WlBpWktCV1pyOGJpR1lVWkUwVzVtcmlSeHc4Z24zU2FIMlYzUjJubmpB"
            },
            "userInterfaceTheme": "USER_INTERFACE_THEME_DARK",
            "timeZone": "Asia/Calcutta",
            "browserName": "Chrome",
            "browserVersion": "141.0.0.0",
            "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "deviceExperimentId": "ChxOelUyTXpjM01UWTVPRFUxT0RJd01ETTBPUT09EMnU38cGGMnU38cG",
            "rolloutToken": "CIfLptjqy7SvGhDt8Y3MnYuQAxiTlKXm-rWQAw%3D%3D",
            "screenWidthPoints": 1528,
            "screenHeightPoints": 738,
            "screenPixelDensity": 1,
            "screenDensityFloat": 1.25,
            "utcOffsetMinutes": 330,
            "musicAppInfo": {
                "pwaInstallabilityStatus": "PWA_INSTALLABILITY_STATUS_CAN_BE_INSTALLED",
                "webDisplayMode": "WEB_DISPLAY_MODE_BROWSER",
                "storeDigitalGoodsApiSupportStatus": {
                    "playStoreDigitalGoodsApiSupportStatus": "DIGITAL_GOODS_API_SUPPORT_STATUS_UNSUPPORTED"
                }
            }
        },
        "user": {
            "lockedSafetyMode": False
        },
        "request": {
            "useSsl": True,
            "internalExperimentFlags": [],
            "consistencyTokenJars": []
        },
        "clickTracking": {
            "clickTrackingParams": "CAQQtSwYASITCIaU0ZWOtpADFdG2VgEdalEQ6coBBH4s0hE="
        },
        "adSignalsInfo": {
            "params": [
                {"key": "dt", "value": "1761077832863"},
                {"key": "flash", "value": "0"},
                {"key": "frm", "value": "0"},
                {"key": "u_tz", "value": "330"},
                {"key": "u_his", "value": "3"},
                {"key": "u_h", "value": "864"},
                {"key": "u_w", "value": "1536"},
                {"key": "u_ah", "value": "816"},
                {"key": "u_aw", "value": "1536"},
                {"key": "u_cd", "value": "24"},
                {"key": "bc", "value": "31"},
                {"key": "bih", "value": "738"},
                {"key": "biw", "value": "1513"},
                {"key": "brdim", "value": "0,0,0,0,1536,0,1536,816,1528,738"},
                {"key": "vis", "value": "1"},
                {"key": "wgl", "value": "true"},
                {"key": "ca_type", "value": "image"}
            ]
        }
    },
    "browseId": "VLOLAK5uy_lSTp1DIuzZBUyee3kDsXwPgP25WdfwB40"
}

# Make the POST request
url = "https://music.youtube.com/youtubei/v1/browse?prettyPrint=false"
response = requests.post(url, headers=headers, json=payload)

# Save response to output.json
with open('output.json', 'w', encoding='utf-8') as f:
    json.dump(response.json(), f, indent=2, ensure_ascii=False)

print(f"Response status code: {response.status_code}")
print("Response saved to output.json")
