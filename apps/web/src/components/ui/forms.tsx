import React from 'react';

/**
 * @component Checkbox
 * @description Componente de seleção múltipla padronizado para o Design System.
 * @purpose Permite ao usuário selecionar uma ou mais opções em um formulário de configurações.
 * @properties 
 * - checked (boolean): Estado atual do checkbox.
 * - onChange (function): Callback disparado na alteração.
 * - disabled (boolean): Bloqueia a interação.
 * @bestPractices Sempre acompanhar com uma label semântica clicável.
 */
export function Checkbox({ checked, onChange, disabled, ...props }: any) {
  return (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
      {...props}
    />
  );
}

/**
 * @component Switch
 * @description Toggle switch para opções binárias instantâneas.
 * @purpose Usado principalmente em configurações globais ou ativação de feature flags (ex: Auto Publish).
 */
export function Switch({ checked, onChange, disabled }: any) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50`}
    >
      <span aria-hidden="true" className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
    </button>
  );
}

/**
 * @component Textarea
 * @description Área de texto expansível unificada.
 * @purpose Entradas longas como descrições de produtos ou copy manual do usuário.
 */
export function Textarea({ className = '', ...props }: any) {
  return (
    <textarea 
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

// ... Mais componentes do Design System (Radio, Select, etc)
