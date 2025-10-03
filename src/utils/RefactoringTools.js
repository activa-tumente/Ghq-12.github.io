// Sistema de herramientas de refactoring para facilitar el mantenimiento del código

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Contexto para herramientas de refactoring
const RefactoringContext = createContext({
  refactoringHistory: [],
  addRefactoring: () => {},
  undoRefactoring: () => {},
  getRefactoringSuggestions: () => {},
  applyRefactoring: () => {}
});

// Tipos de refactoring disponibles
const REFACTORING_TYPES = {
  EXTRACT_FUNCTION: 'extract_function',
  EXTRACT_COMPONENT: 'extract_component',
  RENAME_VARIABLE: 'rename_variable',
  SIMPLIFY_CONDITIONAL: 'simplify_conditional',
  REMOVE_DUPLICATION: 'remove_duplication',
  OPTIMIZE_IMPORTS: 'optimize_imports',
  SPLIT_LARGE_FILE: 'split_large_file',
  MODERNIZE_SYNTAX: 'modernize_syntax',
  ADD_ERROR_HANDLING: 'add_error_handling',
  IMPROVE_PERFORMANCE: 'improve_performance'
};

// Provider de herramientas de refactoring
export const RefactoringProvider = ({ children }) => {
  const [refactoringHistory, setRefactoringHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const analysisCache = useRef(new Map());

  const addRefactoring = useCallback((refactoring) => {
    setRefactoringHistory(prev => [
      ...prev,
      {
        ...refactoring,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        applied: false
      }
    ]);
  }, []);

  const undoRefactoring = useCallback((refactoringId) => {
    setRefactoringHistory(prev => 
      prev.map(ref => 
        ref.id === refactoringId 
          ? { ...ref, applied: false, undone: true }
          : ref
      )
    );
  }, []);

  const getRefactoringSuggestions = useCallback((code, filename) => {
    const cacheKey = `${filename}-${code.length}`;
    
    if (analysisCache.current.has(cacheKey)) {
      return analysisCache.current.get(cacheKey);
    }

    const suggestions = analyzeCodeForRefactoring(code, filename);
    analysisCache.current.set(cacheKey, suggestions);
    setSuggestions(suggestions);
    
    return suggestions;
  }, []);

  const applyRefactoring = useCallback((refactoringId, code) => {
    const refactoring = refactoringHistory.find(r => r.id === refactoringId);
    if (!refactoring) return code;

    const refactoredCode = executeRefactoring(refactoring, code);
    
    setRefactoringHistory(prev => 
      prev.map(ref => 
        ref.id === refactoringId 
          ? { ...ref, applied: true, result: refactoredCode }
          : ref
      )
    );

    return refactoredCode;
  }, [refactoringHistory]);

  return (
    <RefactoringContext.Provider value={{
      refactoringHistory,
      suggestions,
      addRefactoring,
      undoRefactoring,
      getRefactoringSuggestions,
      applyRefactoring
    }}>
      {children}
    </RefactoringContext.Provider>
  );
};

// Hook para usar herramientas de refactoring
export const useRefactoring = () => {
  const context = useContext(RefactoringContext);
  if (!context) {
    throw new Error('useRefactoring debe usarse dentro de RefactoringProvider');
  }
  return context;
};

// Analizador de código para identificar oportunidades de refactoring
const analyzeCodeForRefactoring = (code, filename) => {
  const suggestions = [];
  const lines = code.split('\n');
  
  // Detectar funciones largas
  const longFunctions = detectLongFunctions(code);
  longFunctions.forEach(func => {
    suggestions.push({
      type: REFACTORING_TYPES.EXTRACT_FUNCTION,
      priority: 'high',
      title: `Función '${func.name}' es muy larga`,
      description: `La función tiene ${func.lines} líneas. Considerar dividir en funciones más pequeñas.`,
      location: func.location,
      effort: 'medium',
      impact: 'high',
      automated: false
    });
  });

  // Detectar código duplicado
  const duplications = detectCodeDuplication(code);
  duplications.forEach(dup => {
    suggestions.push({
      type: REFACTORING_TYPES.REMOVE_DUPLICATION,
      priority: 'medium',
      title: 'Código duplicado detectado',
      description: `${dup.occurrences} bloques similares encontrados.`,
      location: dup.locations,
      effort: 'medium',
      impact: 'medium',
      automated: true
    });
  });

  // Detectar condicionales complejas
  const complexConditionals = detectComplexConditionals(code);
  complexConditionals.forEach(cond => {
    suggestions.push({
      type: REFACTORING_TYPES.SIMPLIFY_CONDITIONAL,
      priority: 'medium',
      title: 'Condicional compleja detectada',
      description: 'Considerar simplificar usando early returns o funciones auxiliares.',
      location: cond.location,
      effort: 'low',
      impact: 'medium',
      automated: true
    });
  });

  // Detectar componentes React grandes
  const largeComponents = detectLargeComponents(code);
  largeComponents.forEach(comp => {
    suggestions.push({
      type: REFACTORING_TYPES.EXTRACT_COMPONENT,
      priority: 'high',
      title: `Componente '${comp.name}' es muy grande`,
      description: `El componente tiene ${comp.lines} líneas. Considerar dividir en componentes más pequeños.`,
      location: comp.location,
      effort: 'high',
      impact: 'high',
      automated: false
    });
  });

  // Detectar imports no optimizados
  const importIssues = detectImportIssues(code);
  if (importIssues.length > 0) {
    suggestions.push({
      type: REFACTORING_TYPES.OPTIMIZE_IMPORTS,
      priority: 'low',
      title: 'Imports pueden ser optimizados',
      description: 'Reorganizar y limpiar imports no utilizados.',
      location: { start: 1, end: 20 },
      effort: 'low',
      impact: 'low',
      automated: true
    });
  }

  // Detectar sintaxis obsoleta
  const outdatedSyntax = detectOutdatedSyntax(code);
  outdatedSyntax.forEach(syntax => {
    suggestions.push({
      type: REFACTORING_TYPES.MODERNIZE_SYNTAX,
      priority: 'low',
      title: 'Sintaxis obsoleta detectada',
      description: `Modernizar ${syntax.type} a sintaxis ES6+.`,
      location: syntax.location,
      effort: 'low',
      impact: 'low',
      automated: true
    });
  });

  // Detectar falta de manejo de errores
  const errorHandlingIssues = detectMissingErrorHandling(code);
  errorHandlingIssues.forEach(issue => {
    suggestions.push({
      type: REFACTORING_TYPES.ADD_ERROR_HANDLING,
      priority: 'medium',
      title: 'Falta manejo de errores',
      description: 'Agregar try-catch o validaciones apropiadas.',
      location: issue.location,
      effort: 'medium',
      impact: 'high',
      automated: false
    });
  });

  // Detectar oportunidades de optimización de rendimiento
  const performanceIssues = detectPerformanceIssues(code);
  performanceIssues.forEach(issue => {
    suggestions.push({
      type: REFACTORING_TYPES.IMPROVE_PERFORMANCE,
      priority: 'medium',
      title: issue.title,
      description: issue.description,
      location: issue.location,
      effort: 'medium',
      impact: 'medium',
      automated: issue.automated
    });
  });

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Detectar funciones largas
const detectLongFunctions = (code) => {
  const functions = [];
  const functionPattern = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*=>|function))\s*\{/g;
  
  let match;
  while ((match = functionPattern.exec(code)) !== null) {
    const functionName = match[1] || match[2] || 'anonymous';
    const startIndex = match.index;
    
    // Encontrar el final de la función
    let braceCount = 1;
    let endIndex = startIndex + match[0].length;
    
    while (braceCount > 0 && endIndex < code.length) {
      if (code[endIndex] === '{') braceCount++;
      if (code[endIndex] === '}') braceCount--;
      endIndex++;
    }
    
    const functionCode = code.substring(startIndex, endIndex);
    const lines = functionCode.split('\n').length;
    
    if (lines > 50) {
      functions.push({
        name: functionName,
        lines,
        location: {
          start: code.substring(0, startIndex).split('\n').length,
          end: code.substring(0, endIndex).split('\n').length
        }
      });
    }
  }
  
  return functions;
};

// Detectar código duplicado
const detectCodeDuplication = (code) => {
  const duplications = [];
  const lines = code.split('\n');
  const minBlockSize = 5;
  
  for (let i = 0; i < lines.length - minBlockSize; i++) {
    const block = lines.slice(i, i + minBlockSize).join('\n').trim();
    if (block.length < 50) continue; // Ignorar bloques muy pequeños
    
    const occurrences = [];
    
    for (let j = i + minBlockSize; j < lines.length - minBlockSize; j++) {
      const compareBlock = lines.slice(j, j + minBlockSize).join('\n').trim();
      
      if (calculateSimilarity(block, compareBlock) > 0.8) {
        occurrences.push({
          start: j + 1,
          end: j + minBlockSize
        });
      }
    }
    
    if (occurrences.length > 0) {
      duplications.push({
        occurrences: occurrences.length + 1,
        locations: [
          { start: i + 1, end: i + minBlockSize },
          ...occurrences
        ]
      });
    }
  }
  
  return duplications;
};

// Detectar condicionales complejas
const detectComplexConditionals = (code) => {
  const complexConditionals = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Detectar if statements con múltiples condiciones
    if (trimmedLine.startsWith('if') || trimmedLine.includes('} else if')) {
      const conditionCount = (trimmedLine.match(/&&|\|\|/g) || []).length;
      const hasComplexNesting = trimmedLine.includes('(') && 
        (trimmedLine.match(/\(/g) || []).length > 2;
      
      if (conditionCount > 2 || hasComplexNesting) {
        complexConditionals.push({
          location: {
            start: index + 1,
            end: index + 1
          },
          complexity: conditionCount + (hasComplexNesting ? 2 : 0)
        });
      }
    }
  });
  
  return complexConditionals;
};

// Detectar componentes React grandes
const detectLargeComponents = (code) => {
  const components = [];
  const componentPattern = /(?:const|function)\s+([A-Z][a-zA-Z0-9_$]*)\s*[=\(]/g;
  
  let match;
  while ((match = componentPattern.exec(code)) !== null) {
    const componentName = match[1];
    const startIndex = match.index;
    
    // Encontrar el final del componente
    let braceCount = 0;
    let endIndex = startIndex;
    let foundStart = false;
    
    while (endIndex < code.length) {
      if (code[endIndex] === '{') {
        braceCount++;
        foundStart = true;
      }
      if (code[endIndex] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) break;
      }
      endIndex++;
    }
    
    const componentCode = code.substring(startIndex, endIndex);
    const lines = componentCode.split('\n').length;
    
    if (lines > 100) {
      components.push({
        name: componentName,
        lines,
        location: {
          start: code.substring(0, startIndex).split('\n').length,
          end: code.substring(0, endIndex).split('\n').length
        }
      });
    }
  }
  
  return components;
};

// Detectar problemas con imports
const detectImportIssues = (code) => {
  const issues = [];
  const importLines = code.split('\n').filter(line => line.trim().startsWith('import'));
  
  // Detectar imports no utilizados (simplificado)
  importLines.forEach(importLine => {
    const importMatch = importLine.match(/import\s+(?:{([^}]+)}|([a-zA-Z_$][a-zA-Z0-9_$]*))/);
    if (importMatch) {
      const imports = importMatch[1] ? 
        importMatch[1].split(',').map(i => i.trim()) : 
        [importMatch[2]];
      
      imports.forEach(importName => {
        if (importName && !code.includes(importName.replace(/\s+as\s+\w+/, ''))) {
          issues.push({ type: 'unused', import: importName });
        }
      });
    }
  });
  
  return issues;
};

// Detectar sintaxis obsoleta
const detectOutdatedSyntax = (code) => {
  const outdated = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Detectar var en lugar de const/let
    if (line.includes('var ') && !line.trim().startsWith('//')) {
      outdated.push({
        type: 'var declaration',
        location: { start: index + 1, end: index + 1 }
      });
    }
    
    // Detectar function() en lugar de arrow functions
    if (line.includes('function(') && !line.includes('function ')) {
      outdated.push({
        type: 'function expression',
        location: { start: index + 1, end: index + 1 }
      });
    }
    
    // Detectar concatenación de strings en lugar de template literals
    if (line.includes('" + ') || line.includes("' + ")) {
      outdated.push({
        type: 'string concatenation',
        location: { start: index + 1, end: index + 1 }
      });
    }
  });
  
  return outdated;
};

// Detectar falta de manejo de errores
const detectMissingErrorHandling = (code) => {
  const issues = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Detectar async/await sin try-catch
    if (line.includes('await ') && !code.includes('try {')) {
      issues.push({
        location: { start: index + 1, end: index + 1 },
        type: 'async without try-catch'
      });
    }
    
    // Detectar fetch sin .catch()
    if (line.includes('fetch(') && !line.includes('.catch')) {
      issues.push({
        location: { start: index + 1, end: index + 1 },
        type: 'fetch without error handling'
      });
    }
  });
  
  return issues;
};

// Detectar problemas de rendimiento
const detectPerformanceIssues = (code) => {
  const issues = [];
  const lines = code.split('\n');
  
  lines.forEach((line, index) => {
    // Detectar funciones en render sin useCallback
    if (line.includes('onClick={') && line.includes('=>') && !code.includes('useCallback')) {
      issues.push({
        title: 'Función inline en render',
        description: 'Considerar usar useCallback para optimizar re-renders',
        location: { start: index + 1, end: index + 1 },
        automated: true
      });
    }
    
    // Detectar objetos/arrays en render sin useMemo
    if ((line.includes('={[') || line.includes('={{')) && !code.includes('useMemo')) {
      issues.push({
        title: 'Objeto/Array inline en render',
        description: 'Considerar usar useMemo para evitar recreación en cada render',
        location: { start: index + 1, end: index + 1 },
        automated: true
      });
    }
    
    // Detectar map sin key
    if (line.includes('.map(') && !line.includes('key=')) {
      issues.push({
        title: 'Map sin key prop',
        description: 'Agregar key prop única para optimizar reconciliación',
        location: { start: index + 1, end: index + 1 },
        automated: false
      });
    }
  });
  
  return issues;
};

// Calcular similitud entre dos bloques de código
const calculateSimilarity = (block1, block2) => {
  const normalize = (str) => str.replace(/\s+/g, ' ').trim().toLowerCase();
  const norm1 = normalize(block1);
  const norm2 = normalize(block2);
  
  if (norm1 === norm2) return 1;
  
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  
  return (commonWords.length * 2) / (words1.length + words2.length);
};

// Ejecutar refactoring específico
const executeRefactoring = (refactoring, code) => {
  switch (refactoring.type) {
    case REFACTORING_TYPES.OPTIMIZE_IMPORTS:
      return optimizeImports(code);
    
    case REFACTORING_TYPES.MODERNIZE_SYNTAX:
      return modernizeSyntax(code);
    
    case REFACTORING_TYPES.SIMPLIFY_CONDITIONAL:
      return simplifyConditionals(code, refactoring.location);
    
    case REFACTORING_TYPES.IMPROVE_PERFORMANCE:
      return improvePerformance(code, refactoring);
    
    default:
      return code;
  }
};

// Optimizar imports
const optimizeImports = (code) => {
  const lines = code.split('\n');
  const imports = [];
  const otherLines = [];
  
  lines.forEach(line => {
    if (line.trim().startsWith('import ')) {
      imports.push(line);
    } else {
      otherLines.push(line);
    }
  });
  
  // Agrupar y ordenar imports
  const reactImports = imports.filter(imp => imp.includes('react'));
  const libraryImports = imports.filter(imp => !imp.includes('react') && !imp.includes('./'));
  const relativeImports = imports.filter(imp => imp.includes('./'));
  
  const organizedImports = [
    ...reactImports.sort(),
    '',
    ...libraryImports.sort(),
    '',
    ...relativeImports.sort()
  ].filter(line => line !== '' || imports.length > 0);
  
  return [...organizedImports, '', ...otherLines].join('\n');
};

// Modernizar sintaxis
const modernizeSyntax = (code) => {
  return code
    .replace(/var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g, 'const $1 =')
    .replace(/function\s*\(([^)]*)\)\s*\{/g, '($1) => {')
    .replace(/(["'])([^"']*?)\1\s*\+\s*(["'])([^"']*?)\3/g, '`$2$4`')
    .replace(/\.bind\(this\)/g, '');
};

// Simplificar condicionales
const simplifyConditionals = (code, location) => {
  const lines = code.split('\n');
  const targetLine = lines[location.start - 1];
  
  // Simplificar condiciones complejas usando early returns
  if (targetLine.includes('if') && targetLine.includes('&&')) {
    const simplified = targetLine.replace(
      /if\s*\((.+?)\s*&&\s*(.+?)\)/,
      'if (!$1) return;\n  if (!$2)'
    );
    lines[location.start - 1] = simplified;
  }
  
  return lines.join('\n');
};

// Mejorar rendimiento
const improvePerformance = (code, refactoring) => {
  const lines = code.split('\n');
  const targetLine = lines[refactoring.location.start - 1];
  
  // Agregar useCallback para funciones inline
  if (targetLine.includes('onClick={') && targetLine.includes('=>')) {
    const improved = targetLine.replace(
      /onClick=\{([^}]+)\}/,
      'onClick={useCallback($1, [])}'n    );
    lines[refactoring.location.start - 1] = improved;
    
    // Agregar import de useCallback si no existe
    if (!code.includes('useCallback')) {
      const reactImportIndex = lines.findIndex(line => line.includes('import') && line.includes('react'));
      if (reactImportIndex !== -1) {
        lines[reactImportIndex] = lines[reactImportIndex].replace(
          /import\s*{([^}]+)}/,
          'import { $1, useCallback }'
        );
      }
    }
  }
  
  return lines.join('\n');
};

// Utilidades de refactoring
export const refactoringUtils = {
  // Extraer función de un bloque de código
  extractFunction: (code, startLine, endLine, functionName) => {
    const lines = code.split('\n');
    const extractedLines = lines.slice(startLine - 1, endLine);
    const extractedCode = extractedLines.join('\n');
    
    // Crear nueva función
    const newFunction = `\nconst ${functionName} = () => {\n${extractedCode}\n};\n`;
    
    // Reemplazar código original con llamada a función
    const beforeExtraction = lines.slice(0, startLine - 1);
    const afterExtraction = lines.slice(endLine);
    const functionCall = `  ${functionName}();`;
    
    return {
      refactoredCode: [...beforeExtraction, functionCall, ...afterExtraction].join('\n'),
      extractedFunction: newFunction
    };
  },
  
  // Renombrar variable en todo el código
  renameVariable: (code, oldName, newName) => {
    const regex = new RegExp(`\\b${oldName}\\b`, 'g');
    return code.replace(regex, newName);
  },
  
  // Dividir archivo grande
  splitLargeFile: (code, filename) => {
    const lines = code.split('\n');
    const imports = lines.filter(line => line.trim().startsWith('import'));
    const exports = lines.filter(line => line.trim().startsWith('export'));
    
    // Identificar componentes y funciones
    const components = [];
    const utilities = [];
    
    let currentBlock = [];
    let inComponent = false;
    
    lines.forEach(line => {
      if (line.match(/^(?:const|function)\s+[A-Z]/)) {
        if (currentBlock.length > 0) {
          (inComponent ? components : utilities).push(currentBlock.join('\n'));
        }
        currentBlock = [line];
        inComponent = true;
      } else if (line.match(/^(?:const|function)\s+[a-z]/)) {
        if (currentBlock.length > 0) {
          (inComponent ? components : utilities).push(currentBlock.join('\n'));
        }
        currentBlock = [line];
        inComponent = false;
      } else {
        currentBlock.push(line);
      }
    });
    
    if (currentBlock.length > 0) {
      (inComponent ? components : utilities).push(currentBlock.join('\n'));
    }
    
    return {
      components: components.map((comp, index) => ({
        filename: `${filename.replace('.jsx', '')}Component${index + 1}.jsx`,
        content: [...imports, '', comp].join('\n')
      })),
      utilities: utilities.length > 0 ? {
        filename: `${filename.replace('.jsx', '')}Utils.js`,
        content: [...imports.filter(imp => !imp.includes('react')), '', ...utilities].join('\n')
      } : null
    };
  },
  
  // Calcular métricas de complejidad
  calculateComplexity: (code) => {
    const lines = code.split('\n');
    let cyclomaticComplexity = 1;
    let nestingLevel = 0;
    let maxNesting = 0;
    
    lines.forEach(line => {
      // Calcular complejidad ciclomática
      const complexityKeywords = /\b(if|else|while|for|switch|case|catch|&&|\|\|)\b/g;
      const matches = line.match(complexityKeywords);
      if (matches) {
        cyclomaticComplexity += matches.length;
      }
      
      // Calcular nivel de anidamiento
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      nestingLevel += openBraces - closeBraces;
      maxNesting = Math.max(maxNesting, nestingLevel);
    });
    
    return {
      cyclomaticComplexity,
      maxNestingLevel: maxNesting,
      linesOfCode: lines.filter(line => line.trim() && !line.trim().startsWith('//')).length,
      maintainabilityIndex: Math.max(0, 171 - 5.2 * Math.log(cyclomaticComplexity) - 0.23 * maxNesting)
    };
  }
};

// Componente de panel de refactoring
export const RefactoringPanel = ({ code, filename, onCodeChange }) => {
  const { getRefactoringSuggestions, applyRefactoring, addRefactoring } = useRefactoring();
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzecode = async () => {
    setIsAnalyzing(true);
    try {
      const newSuggestions = getRefactoringSuggestions(code, filename);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error analizando código:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyRefactoring = (suggestion) => {
    if (suggestion.automated) {
      addRefactoring(suggestion);
      const refactoredCode = executeRefactoring(suggestion, code);
      if (onCodeChange) {
        onCodeChange(refactoredCode);
      }
    } else {
      setSelectedSuggestion(suggestion);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-400 bg-red-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'low': return 'border-blue-400 bg-blue-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Herramientas de Refactoring</h3>
        <button
          onClick={analyzecode}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isAnalyzing ? 'Analizando...' : 'Analizar Código'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Sugerencias de Refactoring ({suggestions.length})</h4>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-3 border-l-4 rounded ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{suggestion.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{suggestion.description}</div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Prioridad: {suggestion.priority}</span>
                    <span>Esfuerzo: {suggestion.effort}</span>
                    <span>Impacto: {suggestion.impact}</span>
                    {suggestion.automated && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        Automatizable
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleApplyRefactoring(suggestion)}
                  className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  {suggestion.automated ? 'Aplicar' : 'Ver Detalles'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSuggestion && (
        <div className="mt-4 p-4 bg-gray-50 border rounded">
          <h5 className="font-medium mb-2">Detalles del Refactoring</h5>
          <p className="text-sm text-gray-600 mb-3">{selectedSuggestion.description}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                addRefactoring(selectedSuggestion);
                setSelectedSuggestion(null);
              }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Marcar como Pendiente
            </button>
            <button
              onClick={() => setSelectedSuggestion(null)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {suggestions.length === 0 && !isAnalyzing && (
        <div className="text-center py-8 text-gray-500">
          <p>No hay sugerencias de refactoring disponibles.</p>
          <p className="text-sm mt-1">Haz clic en "Analizar Código" para buscar oportunidades de mejora.</p>
        </div>
      )}
    </div>
  );
};

export default {
  RefactoringProvider,
  useRefactoring,
  refactoringUtils,
  RefactoringPanel,
  REFACTORING_TYPES
};