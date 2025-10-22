import requests
import json

# Headers for the request
headers = {
    'Host': 'music.youtube.com',
    'Cookie': 'VISITOR_INFO1_LIVE=XXi86JNt09c; VISITOR_PRIVACY_METADATA=CgJJThIEGgAgMw%3D%3D; VISITOR_INFO1_LIVE=XXi86JNt09c; VISITOR_PRIVACY_METADATA=CgJJThIEGgAgMw%3D%3D; __Secure-ROLLOUT_TOKEN=CIfLptjqy7SvGhDt8Y3MnYuQAxiTlKXm-rWQAw%3D%3D; PREF=tz=Asia.Calcutta&f7=100&f6=40000000&f4=4000000&repeat=NONE; YSC=4Lgxs0AY-hQ',
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
    'X-Goog-Visitor-Id': 'CgtYWGk4NkpOdDA5Yyi-oePHBjIKCgJJThIEGgAgMw%3D%3D',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Sec-Ch-Ua-Platform-Version': '"19.0.0"',
    'Accept': '*/*',
    'Origin': 'https://music.youtube.com',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'same-origin',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://music.youtube.com/watch?v=sjWIhY_MSSU&list=OLAK5uy_mTy697h0Mam5UvrR8tjia1BPzaNtF80I0',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9,en-IN;q=0.8',
    'Priority': 'u=1, i'
}

# Request payload
payload = {
    "enablePersistentPlaylistPanel": True,
    "tunerSettingValue": "AUTOMIX_SETTING_NORMAL",
    "videoId": "sjWIhY_MSSU",
    "playlistId": "OLAK5uy_mTy697h0Mam5UvrR8tjia1BPzaNtF80I0",
    "params": "8gEAmgMDCNgE",
    "playerParams": "igMDCNgE4AQB",
    "loggingContext": {
        "vssLoggingContext": {
            "serializedContextData": "GilPTEFLNXV5X21UeTY5N2gwTWFtNVV2clI4dGppYTFCUHphTnRGODBJMA%3D%3D"
        }
    },
    "isAudioOnly": True,
    "responsiveSignals": {
        "videoInteraction": []
    },
    "queueContextParams": "",
    "context": {
        "client": {
            "hl": "en",
            "gl": "IN",
            "remoteHost": "157.48.211.82",
            "deviceMake": "",
            "deviceModel": "",
            "visitorData": "CgtYWGk4NkpOdDA5Yyi-oePHBjIKCgJJThIEGgAgMw%3D%3D",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36,gzip(gfe)",
            "clientName": "WEB_REMIX",
            "clientVersion": "1.20251015.03.00",
            "osName": "Windows",
            "osVersion": "10.0",
            "originalUrl": "https://music.youtube.com/watch?v=sjWIhY_MSSU&list=OLAK5uy_mTy697h0Mam5UvrR8tjia1BPzaNtF80I0",
            "screenPixelDensity": 1,
            "platform": "DESKTOP",
            "clientFormFactor": "UNKNOWN_FORM_FACTOR",
            "configInfo": {
                "appInstallData": "CL6h48cGEPHMzxwQlPLPHBDg6c8cEJX3zxwQzN-uBRC35M8cENr3zhwQuOTOHBDni9AcEOGO0BwQ_LLOHBCL988cEPr_zxwQ8J3PHBC36v4SEMGP0BwQrtbPHBC3yc8cEJuR0BwQjOnPHBCZmLEFENqK0BwQudnOHBCBzc4cEK-GzxwQvYqwBRCBlNAcEJOD0BwQz43QHBC49s8cENPhrwUQvZmwBRC72c4cEJbbzxwQyfevBRCHrM4cENGxgBMQibDOHBD2q7AFEL22rgUQ55XQHBDH988cEJ3QsAUQ3rzOHBCd188cEKOZ0BwQxcPPHBCttYATEIvrzxwQ4pfQHBDwnLAFEPLozxwQmY2xBRCa9s8cENmF0BwQlbGAExDe6c8cEMzrzxwQlP6wBRCEkdAcEOK4sAUQm4jQHBCIh7AFEOO4zxwqQENBTVNLaFVoLVpxLURNZVVFcXZlOEFzeXYxX3AxUVVEemY4Rm9ZQUdvaTZrWXExeDZpZjJEOUVWbFNJZEJ3PT0wAA%3D%3D",
                "coldConfigData": None,
                "coldHashData": None,
                "hotHashData": None
            },
            "screenDensityFloat": 1.25,
            "userInterfaceTheme": "USER_INTERFACE_THEME_DARK",
            "timeZone": "Asia/Calcutta",
            "browserName": "Chrome",
            "browserVersion": "141.0.0.0",
            "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "deviceExperimentId": "ChxOelUyTkRBeU5UQTVNREV4TWpJek16STFOZz09EL6h48cGGL6h48cG",
            "rolloutToken": "CIfLptjqy7SvGhDt8Y3MnYuQAxiTlKXm-rWQAw%3D%3D",
            "screenWidthPoints": 1528,
            "screenHeightPoints": 738,
            "utcOffsetMinutes": 330,
            "musicAppInfo": {
                "webDisplayMode": "WEB_DISPLAY_MODE_BROWSER",
                "storeDigitalGoodsApiSupportStatus": {
                    "playStoreDigitalGoodsApiSupportStatus": "DIGITAL_GOODS_API_SUPPORT_STATUS_UNKNOWN"
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
            "clickTrackingParams": "IhMIybbT-em3kAMV-59LBR2kYSejMghleHRlcm5hbMoBBH4s0hE="
        },
        "adSignalsInfo": {
            "params": [
                {"key": "dt", "value": "1761136839104"},
                {"key": "flash", "value": "0"},
                {"key": "frm", "value": "0"},
                {"key": "u_tz", "value": "330"},
                {"key": "u_his", "value": "8"},
                {"key": "u_h", "value": "864"},
                {"key": "u_w", "value": "1536"},
                {"key": "u_ah", "value": "816"},
                {"key": "u_aw", "value": "1536"},
                {"key": "u_cd", "value": "24"},
                {"key": "bc", "value": "31"},
                {"key": "bih", "value": "738"},
                {"key": "biw", "value": "1528"},
                {"key": "brdim", "value": "0,0,0,0,1536,0,1536,816,1528,738"},
                {"key": "vis", "value": "1"},
                {"key": "wgl", "value": "true"},
                {"key": "ca_type", "value": "image"}
            ]
        }
    }
}

# Make the POST request
url = "https://music.youtube.com/youtubei/v1/next?prettyPrint=false"
response = requests.post(url, headers=headers, json=payload)

# Save response to next.json file
with open('next.json', 'w', encoding='utf-8') as f:
    json.dump(response.json(), f, indent=2, ensure_ascii=False)

print(f"Response saved to next.json with status code: {response.status_code}")
