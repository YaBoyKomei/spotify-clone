const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAI() {
  console.log('🧪 Testing AI API...');
  
  const boundary = "----WebKitFormBoundary2EZaPVKzInbQDlEI";
  const messages = [{ 
    role: "user", 
    content: "Recommend 5 popular songs. Format each as: 'Song Title by Artist Name' on separate lines. Only provide song recommendations, nothing else."
  }];
  
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="chat_style"\r\n',
    'chat',
    `--${boundary}`,
    'Content-Disposition: form-data; name="chatHistory"\r\n',
    JSON.stringify(messages),
    `--${boundary}`,
    'Content-Disposition: form-data; name="model"\r\n',
    'standard',
    `--${boundary}`,
    'Content-Disposition: form-data; name="hacker_is_stinky"\r\n',
    'very_stinky',
    `--${boundary}--`
  ].join('\r\n');
  
  try {
    const response = await fetch('https://api.deepai.org/hacking_is_a_serious_crime', {
      method: 'POST',
      headers: {
        'Api-Key': 'tryit-69244861019-9ebc4eeb1aa323e195fa7bb7a0fcc026',
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      },
      body: body
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📝 AI Response:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.output) {
        console.log('\n🎵 Output text:');
        console.log(data.output);
        
        console.log('\n🔍 Parsing songs...');
        const lines = data.output.split('\n').filter(line => line.trim());
        lines.forEach((line, i) => {
          const match = line.match(/(?:^\d+\.\s*)?["']?(.+?)["']?\s+by\s+(.+?)$/i) || 
                       line.match(/(?:^\d+\.\s*)?(.+?)\s*-\s*(.+?)$/);
          
          if (match) {
            const [, title, artist] = match;
            console.log(`  ${i+1}. ✅ "${title.trim()}" by ${artist.trim()}`);
          } else {
            console.log(`  ${i+1}. ❌ Could not parse: "${line}"`);
          }
        });
      }
    } else {
      const text = await response.text();
      console.log('Error:', text);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAI();
