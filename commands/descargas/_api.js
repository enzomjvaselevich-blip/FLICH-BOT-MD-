function pickFirstString(values = []) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function extractResult(data = {}) {
  return data?.result || data?.data || data || {};
}

function extractMediaUrl(result = {}) {
  return pickFirstString([
    result?.url,
    result?.download,
    result?.audio,
    result?.video,
    result?.dl,
    result?.link,
    result?.media,
    result?.nowm,
    result?.nowatermark,
    result?.hd,
    result?.sd,
  ]);
}

function extractTitle(result = {}, fallback = 'archivo') {
  return pickFirstString([
    result?.title,
    result?.name,
    result?.filename,
    result?.fileName,
    fallback,
  ]);
}

async function callApi(ctx = {}, endpoint = '', params = {}) {
  const axios = ctx?.axios;
  const settings = ctx?.settings || {};
  const apiBaseUrl = String(settings.apiBaseUrl || 'https://dv-yer-api.online').trim();
  const apiKey = String(settings.apiKey || 'dvyer911840240197').trim();

  if (!axios) {
    throw new Error('Axios no disponible en contexto.');
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/${String(endpoint || '').replace(/^\//, '')}`;
  const response = await axios.get(url, {
    params: { ...params, apikey: apiKey },
    timeout: 60000,
  });

  return extractResult(response?.data || {});
}

module.exports = {
  callApi,
  extractMediaUrl,
  extractTitle,
};
