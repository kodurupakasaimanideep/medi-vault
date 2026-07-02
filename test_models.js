const key = 'AIzaSyDeVG5RVA78UEAaXvFqO5zy4twbE1zfRzA';
const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite'];

async function test(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
  });
  const data = await res.json();
  const msg = data.error ? data.error.message.slice(0, 100) : 'OK - ' + data.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0,30);
  console.log(model, '->', res.status, msg);
}

Promise.all(models.map(test));
