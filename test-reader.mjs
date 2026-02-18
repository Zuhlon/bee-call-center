import ZAI from 'z-ai-web-dev-sdk';

async function readPage() {
  try {
    const zai = await ZAI.create();
    console.log('ZAI initialized, reading page...');
    
    const result = await zai.functions.invoke('page_reader', {
      url: 'https://chat.deepseek.com/share/kj9ammwcdtv6qgrnnv'
    });
    
    console.log('Title:', result.data?.title);
    console.log('HTML length:', result.data?.html?.length);
    console.log('Content preview:', result.data?.html?.substring(0, 2000));
    
    return result.data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

readPage();
