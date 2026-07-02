const key = 'AIzaSyDeVG5RVA78UEAaXvFqO5zy4twbE1zfRzA';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
})
.then(res => res.json().then(data => ({status: res.status, data})))
.then(d => console.log(JSON.stringify(d, null, 2)))
.catch(console.error);
