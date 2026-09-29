'use strict';

const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      ...jsonResponse(405, { success: false, error: 'Método não permitido.' }),
      headers: {
        ...jsonResponse(405, {}).headers,
        Allow: 'POST'
      }
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { success: false, error: 'Requisição inválida.' });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return jsonResponse(400, { success: false, error: 'Informe um e-mail válido.' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
    console.error('Configuração da Brevo ausente ou inválida.');
    return jsonResponse(500, { success: false, error: 'Não foi possível concluir o cadastro.' });
  }

  try {
    const response = await fetch(BREVO_CONTACTS_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true
      })
    });

    if (!response.ok) {
      console.error('A API da Brevo recusou o cadastro.', { status: response.status });
      return jsonResponse(502, { success: false, error: 'Não foi possível concluir o cadastro.' });
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    console.error('Falha ao conectar com a API da Brevo.');
    return jsonResponse(502, { success: false, error: 'Não foi possível concluir o cadastro.' });
  }
};
