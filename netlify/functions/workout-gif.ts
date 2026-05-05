export const handler = async (event: any) => {
  const name = event.queryStringParameters?.name;
  if (!name) {
    return { statusCode: 400, body: JSON.stringify({ error: 'name é obrigatório' }) };
  }

  if (!process.env.WORKOUTX_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'WORKOUTX_KEY não configurada' }) };
  }

  try {
    const url = `https://api.workoutxapp.com/v1/exercises/name/${encodeURIComponent(name)}`;
    const res = await fetch(url, {
      headers: {
        'X-WorkoutX-Key': process.env.WORKOUTX_KEY,
        'Content-Type': 'application/json',
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
