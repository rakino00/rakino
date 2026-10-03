/**
 * python.js — laboratório de automações Python no navegador usando Pyodide.
 * Não exige instalação de Python no computador.
 */
import { esc, toast } from './ui.js';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.mjs';
let pyodide = null;
let loading = null;

async function loadPyodideRuntime() {
  if (pyodide) return pyodide;
  if (loading) return loading;
  loading = import(PYODIDE_URL).then(async (m) => {
    pyodide = await m.loadPyodide();
    return pyodide;
  }).finally(() => { loading = null; });
  return loading;
}

const examples = {
  'Olá': `print("Olá, Rakino!")`,
  'Cálculo': `a = 10\nb = 7\nprint("Resultado:", a + b)`,
  'Lista': `nomes = ["Rakino", "Python", "Pyodide"]\nfor nome in nomes:\n    print("-", nome)`,
};

export function renderPython() {
  return `<div class="python-lab">
    <div class="hero">
      <h1>⚙️ Automações</h1>
      <p>Execute scripts Python diretamente no navegador usando <strong>Pyodide</strong>.</p>
    </div>
    <div class="python-toolbar">
      <button class="btn btn-primary" id="pyRun">▶ Executar</button>
      <button class="btn" id="pyClear">Limpar saída</button>
      <select id="pyExample" aria-label="Exemplos Python">
        <option value="">Exemplos…</option>
        ${Object.keys(examples).map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join('')}
      </select>
      <span id="pyStatus" class="python-status">Pyodide não carregado</span>
    </div>
    <textarea id="pyCode" class="python-editor" spellcheck="false">print("Olá, Rakino!")</textarea>
    <pre id="pyOutput" class="python-output">A saída aparecerá aqui.</pre>
    <p class="modal-note">O código é executado no seu navegador. Arquivos e módulos externos podem exigir carregamento adicional.</p>
  </div>`;
}

export function bindPython(root) {
  const code = root.querySelector('#pyCode');
  const output = root.querySelector('#pyOutput');
  const run = root.querySelector('#pyRun');
  const clear = root.querySelector('#pyClear');
  const example = root.querySelector('#pyExample');
  const status = root.querySelector('#pyStatus');

  example.addEventListener('change', () => {
    if (examples[example.value]) code.value = examples[example.value];
  });
  clear.addEventListener('click', () => { output.textContent = ''; });
  run.addEventListener('click', async () => {
    run.disabled = true;
    status.textContent = 'Carregando Pyodide…';
    output.textContent = '';
    try {
      const py = await loadPyodideRuntime();
      status.textContent = 'Pyodide pronto';
      py.setStdout({ batched: (s) => { output.textContent += s; } });
      py.setStderr({ batched: (s) => { output.textContent += s; } });
      await py.runPythonAsync(code.value);
      if (!output.textContent) output.textContent = 'Executado sem saída.';
    } catch (err) {
      output.textContent = String(err?.message || err);
      status.textContent = 'Erro na execução';
      toast('Erro ao executar Python.', 3500);
    } finally {
      run.disabled = false;
    }
  });
}
