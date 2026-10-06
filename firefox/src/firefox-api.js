export async function evaluateInPage(api, code) {
  if (!api) throw new Error('Open the TypeScript panel in Firefox Developer Tools on a regular web page.');
  const [result, error] = await api.eval(code);
  if (error) throw new Error(error.value || error.description || error.code || 'Page evaluation failed');
  return result;
}
