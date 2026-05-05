export const handler = async (event: any) => {
  const name = event.queryStringParameters?.name;
  if (!name) {
    return { statusCode: 400, body: JSON.stringify({ error: 'name é obrigatório' }) };
  }

  if (!process.env.RAPIDAPI_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RAPIDAPI_KEY não configurada' }) };
  }

  try {
    const url = `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=${encodeURIComponent(name)}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      },
    });

    const data = await res.json();

    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
