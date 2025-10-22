import requests
import json

# Headers for the request
headers = {
    'Host': 'music.youtube.com',
    'Cookie': 'VISITOR_INFO1_LIVE=XXi86JNt09c; VISITOR_PRIVACY_METADATA=CgJJThIEGgAgMw%3D%3D; VISITOR_INFO1_LIVE=XXi86JNt09c; VISITOR_PRIVACY_METADATA=CgJJThIEGgAgMw%3D%3D; __Secure-ROLLOUT_TOKEN=CIfLptjqy7SvGhDt8Y3MnYuQAxiTlKXm-rWQAw%3D%3D; PREF=tz=Asia.Calcutta&f7=100&f6=40000000&f4=4000000&repeat=NONE; YSC=4Lgxs0AY-hQ; YSC=F0mxkyq_O80; ST-11lpuxa=csn=t87zsAh50BNsxG9C&itct=CMgCEKCzAhgCIhMIprWp6vm3kAMV2qbYBR0tog37SLjL0uyAq9vld8oBBH4s0hE%3D',
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
    'X-Goog-Visitor-Id': 'CgtYWGk4NkpOdDA5YyjlwuPHBjIKCgJJThIEGgAgMw%3D%3D',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Sec-Ch-Ua-Platform-Version': '"19.0.0"',
    'Accept': '*/*',
    'Origin': 'https://music.youtube.com',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'same-origin',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://music.youtube.com/watch?v=d8ttWA2Upbg',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9,en-IN;q=0.8',
    'Priority': 'u=1, i'
}

# Request payload
payload = {
    "enablePersistentPlaylistPanel": True,
    "tunerSettingValue": "AUTOMIX_SETTING_NORMAL",
    "videoId": "d8ttWA2Upbg",
    "watchEndpointMusicSupportedConfigs": {
        "watchEndpointMusicConfig": {
            "musicVideoType": "MUSIC_VIDEO_TYPE_OMV"
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
            "visitorData": "CgtYWGk4NkpOdDA5YyjlwuPHBjIKCgJJThIEGgAgMw%3D%3D",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36,gzip(gfe)",
            "clientName": "WEB_REMIX",
            "clientVersion": "1.20251015.03.00",
            "osName": "Windows",
            "osVersion": "10.0",
            "originalUrl": "https://music.youtube.com/explore",
            "screenPixelDensity": 1,
            "platform": "DESKTOP",
            "clientFormFactor": "UNKNOWN_FORM_FACTOR",
            "configInfo": {
                "appInstallData": "COXC48cGEIeszhwQndCwBRDPjdAcEImwzhwQvYqwBRCIh7AFEIvrzxwQ8JywBRDM364FEK21gBMQ9quwBRDy6M8cENGxgBMQ3unPHBCTg9AcEOO4zxwQi_fPHBCU_rAFEJWxgBMQ4pfQHBDg6c8cEIGU0BwQndfPHBC35M8cENmF0BwQmvbPHBDJ968FEK7WzxwQm4jQHBDH988cEL2ZsAUQwY_QHBDiuLAFEJqR0BwQgc3OHBDni9AcEL22rgUQ8J3PHBDa984cEK-GzxwQxcPPHBCFkdAcELj2zxwQu9nOHBCU8s8cEPr_zxwQzOvPHBDhjtAcEJmYsQUQudnOHBC36v4SENPhrwUQjOnPHBC45M4cEPyyzhwQmY2xBRCV988cEPmH0BwQ2orQHBDnldAcEN68zhwQltvPHCo8Q0FNU0tCVWotWnEtRE1lVUVxdmU4QXN5djFfcDFRVUR6ZjhGb1lBR29pNmtZcTF4NmlmMkQtNHdIUWM9MAA%3D",
                "coldConfigData": "COXC48cGGjJBT2pGb3gzOFpQaVpLQldacjhiaUdZVVpFMFc1bXJpUnh3OGduM1NhSDJWM1Iybm5qQSIyQU9qRm94MzhaUGlaS0JXWnI4YmlHWVVaRTBXNW1yaVJ4dzhnbjNTYUgyVjNSMm5uakE%3D",
                "coldHashData": "COXC48cGEhM4MzcyMjg4Nzg1MDY2MDg0NzkyGOXC48cGMjJBT2pGb3gzOFpQaVpLQldacjhiaUdZVVpFMFc1bXJpUnh3OGduM1NhSDJWM1Iybm5qQToyQU9qRm94MzhaUGlaS0JXWnI4YmlHWVVaRTBXNW1yaVJ4dzhnbjNTYUgyVjNSMm5uakE%3D",
                "hotHashData": "COXC48cGEhQxODExMjI5MjU4MDk4MDU5MzAxNBjlwuPHBjIyQU9qRm94MzhaUGlaS0JXWnI4YmlHWVVaRTBXNW1yaVJ4dzhnbjNTYUgyVjNSMm5uakE6MkFPakZveDM4WlBpWktCV1pyOGJpR1lVWkUwVzVtcmlSeHc4Z24zU2FIMlYzUjJubmpB"
            },
            "screenDensityFloat": 1.25,
            "userInterfaceTheme": "USER_INTERFACE_THEME_DARK",
            "timeZone": "Asia/Calcutta",
            "browserName": "Chrome",
            "browserVersion": "141.0.0.0",
            "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "deviceExperimentId": "ChxOelUyTkRBME16TTVPVGd6TkRRNE5EYzRNQT09EOXC48cGGOXC48cG",
            "rolloutToken": "CIfLptjqy7SvGhDt8Y3MnYuQAxiTlKXm-rWQAw%3D%3D",
            "screenWidthPoints": 1528,
            "screenHeightPoints": 738,
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
            "clickTrackingParams": "CMgCEKCzAhgCIhMIprWp6vm3kAMV2qbYBR0tog37SLjL0uyAq9vld8oBBH4s0hE="
        },
        "adSignalsInfo": {
            "params": [
                {"key": "dt", "value": "1761141095431"},
                {"key": "flash", "value": "0"},
                {"key": "frm", "value": "0"},
                {"key": "u_tz", "value": "330"},
                {"key": "u_his", "value": "13"},
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
    }
}

# Make the POST request
url = "https://music.youtube.com/youtubei/v1/next?prettyPrint=false"
response = requests.post(url, headers=headers, json=payload)

# Save response to first.json
with open('first.json', 'w', encoding='utf-8') as f:
    json.dump(response.json(), f, indent=2, ensure_ascii=False)

print(f"Response saved to first.json")
print(f"Status Code: {response.status_code}")
