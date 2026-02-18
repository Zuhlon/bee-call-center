import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function readPage() {
  try {
    const zai = await ZAI.create();
    console.log('Reading full page...');
    
    const result = await zai.functions.invoke('page_reader', {
      url: 'https://chat.deepseek.com/share/kj9ammwcdtv6qgrnnv'
    });
    
    // Save full HTML
    fs.writeFileSync('/home/z/my-project/download/full_page.html', result.data.html);
    
    // Try to extract code blocks with game code
    const html = result.data.html;
    
    // Look for code blocks containing HTML games
    const codeBlockRegex = /```html\s*([\s\S]*?)```/g;
    const matches = [];
    let match;
    
    while ((match = codeBlockRegex.exec(html)) !== null) {
      matches.push(match[1]);
    }
    
    console.log('Found code blocks:', matches.length);
    
    // Save each code block
    matches.forEach((code, i) => {
      if (code.includes('<!DOCTYPE') || code.includes('<html')) {
        fs.writeFileSync(`/home/z/my-project/download/game_code_${i}.html`, code);
        console.log(`Saved game_code_${i}.html, length: ${code.length}`);
      }
    });
    
    // Also search for game-related content in the text
    const gameKeywords = ['пчелиный', 'колл-центр', 'bee', 'call', 'center', 'игра', 'game'];
    const lowerHtml = html.toLowerCase();
    
    console.log('\n--- Searching for game description ---');
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const gameStartIdx = textContent.toLowerCase().indexOf('пчелиный');
    if (gameStartIdx > -1) {
      console.log('Game context:', textContent.substring(gameStartIdx, gameStartIdx + 500));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

readPage();
