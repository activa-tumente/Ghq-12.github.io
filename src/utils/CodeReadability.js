// Sistema de mejora de legibilidad del código con herramientas de análisis y documentación

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Contexto para configuración de legibilidad
const ReadabilityContext = createContext({
  config: {},
  updateConfig: () => {},
  analyzeCode: () => {},
  getRecommendations: () => {}
});

// Configuración por defecto para legibilidad
const DEFAULT_READABILITY_CONFIG = {
  naming: {
    // Convenciones de nomenclatura
    camelCase: true,
    descriptiveNames: true,
    avoidAbbreviations: true,
    maxNameLength: 50,
    minNameLength: 3,
    reservedWords: ['data', 'info', 'item', 'obj', 'temp', 'var']
  },
  functions: {
    maxParameters: 5,
    maxLines: 50,
    requireDocumentation: true,
    singleResponsibility: true
  },
  components: {
    maxProps: 10,
    maxLines: 200,
    requirePropTypes: true,
    requireDisplayName: true
  },
  comments: {
    requireJSDoc: true,
    explainComplexLogic: true,
    avoidObviousComments: true,
    updateOutdatedComments: true
  },
  structure: {
    maxNestingLevel: 4,
    groupRelatedCode: true,
    consistentIndentation: true,
    logicalOrdering: true
  }
};

// Provider de configuración de legibilidad
export const ReadabilityProvider = ({ children, config = {} }) => {
  const [readabilityConfig, setReadabilityConfig] = useState({
    ...DEFAULT_READABILITY_CONFIG,
    ...config
  });
  
  const [analysisResults, setAnalysisResults] = useState({});

  const updateConfig = (newConfig) => {
    setReadabilityConfig(prev => ({
      ...prev,
      ...newConfig
    }));
  };

  const analyzeCode = (code, filename) => {
    const analysis = performCodeAnalysis(code, readabilityConfig);
    setAnalysisResults(prev => ({
      ...prev,
      [filename]: analysis
    }));
    return analysis;
  };

  const getRecommendations = (filename) => {
    return analysisResults[filename]?.recommendations || [];
  };

  return (
    <ReadabilityContext.Provider value={{
      config: readabilityConfig,
      updateConfig,
      analyzeCode,
      getRecommendations,
      analysisResults
    }}>
      {children}
    </ReadabilityContext.Provider>
  );
};

// Hook para usar herramientas de legibilidad
export const useReadability = () => {
  const context = useContext(ReadabilityContext);
  if (!context) {
    throw new Error('useReadability debe usarse dentro de ReadabilityProvider');
  }
  return context;
};

// Analizador de código para legibilidad
const performCodeAnalysis = (code, config) => {
  const issues = [];
  const recommendations = [];
  const metrics = {
    linesOfCode: 0,
    cyclomaticComplexity: 0,
    nestingLevel: 0,
    functionCount: 0,
    componentCount: 0
  };

  // Análisis básico de líneas
  const lines = code.split('\n');
  metrics.linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;

  // Análisis de nomenclatura
  const namingIssues = analyzeNaming(code, config.naming);
  issues.push(...namingIssues);

  // Análisis de funciones
  const functionIssues = analyzeFunctions(code, config.functions);
  issues.push(...functionIssues.issues);
  metrics.functionCount = functionIssues.count;

  // Análisis de componentes React
  const componentIssues = analyzeComponents(code, config.components);
  issues.push(...componentIssues.issues);
  metrics.componentCount = componentIssues.count;

  // Análisis de comentarios
  const commentIssues = analyzeComments(code, config.comments);
  issues.push(...commentIssues);

  // Análisis de estructura
  const structureIssues = analyzeStructure(code, config.structure);
  issues.push(...structureIssues.issues);
  metrics.nestingLevel = structureIssues.maxNesting;
  metrics.cyclomaticComplexity = structureIssues.complexity;

  // Generar recomendaciones
  recommendations.push(...generateRecommendations(issues, metrics, config));

  return {
    issues,
    recommendations,
    metrics,
    score: calculateReadabilityScore(issues, metrics),
    timestamp: new Date().toISOString()
  };
};

// Análisis de nomenclatura
const analyzeNaming = (code, config) => {
  const issues = [];
  
  // Buscar declaraciones de variables, funciones y componentes
  const patterns = {
    variables: /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
    functions: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\)\s*=>|function)/g,
    components: /(?:const|function)\s+([A-Z][a-zA-Z0-9_$]*)/g
  };

  Object.entries(patterns).forEach(([type, pattern]) => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1] || match[2];
      if (!name) continue;

      // Verificar longitud
      if (name.length < config.minNameLength) {
        issues.push({
          type: 'naming',
          severity: 'warning',
          message: `Nombre '${name}' es demasiado corto (mínimo ${config.minNameLength} caracteres)`,
          suggestion: `Usar un nombre más descriptivo para '${name}'`
        });
      }

      if (name.length > config.maxNameLength) {
        issues.push({
          type: 'naming',
          severity: 'warning',
          message: `Nombre '${name}' es demasiado largo (máximo ${config.maxNameLength} caracteres)`,
          suggestion: `Acortar el nombre '${name}' manteniendo claridad`
        });
      }

      // Verificar palabras reservadas genéricas
      if (config.reservedWords.includes(name.toLowerCase())) {
        issues.push({
          type: 'naming',
          severity: 'info',
          message: `Nombre '${name}' es demasiado genérico`,
          suggestion: `Usar un nombre más específico que '${name}'`
        });
      }

      // Verificar camelCase para variables y funciones
      if (config.camelCase && type !== 'components') {
        if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
          issues.push({
            type: 'naming',
            severity: 'warning',
            message: `'${name}' no sigue convención camelCase`,
            suggestion: `Convertir '${name}' a camelCase`
          });
        }
      }

      // Verificar PascalCase para componentes
      if (type === 'components' && !/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        issues.push({
          type: 'naming',
          severity: 'warning',
          message: `Componente '${name}' no sigue convención PascalCase`,
          suggestion: `Convertir '${name}' a PascalCase`
        });
      }
    }
  });

  return issues;
};

// Análisis de funciones
const analyzeFunctions = (code, config) => {
  const issues = [];
  let count = 0;
  
  // Buscar definiciones de funciones
  const functionPattern = /(?:function\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)|const\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*\([^)]*\)\s*=>)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  
  let match;
  while ((match = functionPattern.exec(code)) !== null) {
    count++;
    const functionBody = match[1] || match[0];
    const lines = functionBody.split('\n').filter(line => line.trim()).length;
    
    // Verificar número de líneas
    if (lines > config.maxLines) {
      issues.push({
        type: 'function',
        severity: 'warning',
        message: `Función tiene ${lines} líneas (máximo recomendado: ${config.maxLines})`,
        suggestion: 'Dividir función en funciones más pequeñas'
      });
    }
    
    // Verificar número de parámetros
    const paramMatch = match[0].match(/\(([^)]*)\)/);
    if (paramMatch) {
      const params = paramMatch[1].split(',').filter(p => p.trim()).length;
      if (params > config.maxParameters) {
        issues.push({
          type: 'function',
          severity: 'warning',
          message: `Función tiene ${params} parámetros (máximo recomendado: ${config.maxParameters})`,
          suggestion: 'Considerar usar un objeto de configuración o dividir la función'
        });
      }
    }
  }
  
  return { issues, count };
};

// Análisis de componentes React
const analyzeComponents = (code, config) => {
  const issues = [];
  let count = 0;
  
  // Buscar componentes React
  const componentPattern = /(?:const|function)\s+([A-Z][a-zA-Z0-9_$]*)\s*[=\(]/g;
  
  let match;
  while ((match = componentPattern.exec(code)) !== null) {
    count++;
    const componentName = match[1];
    
    // Verificar displayName
    if (config.requireDisplayName) {
      const displayNamePattern = new RegExp(`${componentName}\.displayName\s*=`);
      if (!displayNamePattern.test(code)) {
        issues.push({
          type: 'component',
          severity: 'info',
          message: `Componente '${componentName}' no tiene displayName`,
          suggestion: `Agregar ${componentName}.displayName = '${componentName}';`
        });
      }
    }
  }
  
  return { issues, count };
};

// Análisis de comentarios
const analyzeComments = (code, config) => {
  const issues = [];
  
  // Buscar comentarios obvios
  if (config.avoidObviousComments) {
    const obviousComments = [
      /\/\/\s*increment\s*i/i,
      /\/\/\s*set\s*.*\s*to\s*.*/i,
      /\/\/\s*return\s*.*/i
    ];
    
    obviousComments.forEach(pattern => {
      if (pattern.test(code)) {
        issues.push({
          type: 'comment',
          severity: 'info',
          message: 'Comentario obvio detectado',
          suggestion: 'Eliminar comentarios que no agregan valor'
        });
      }
    });
  }
  
  // Verificar JSDoc para funciones públicas
  if (config.requireJSDoc) {
    const functionsWithoutJSDoc = code.match(/(?:export\s+)?(?:function|const\s+\w+\s*=)/g);
    const jsDocCount = (code.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
    
    if (functionsWithoutJSDoc && jsDocCount < functionsWithoutJSDoc.length) {
      issues.push({
        type: 'comment',
        severity: 'info',
        message: 'Algunas funciones exportadas no tienen documentación JSDoc',
        suggestion: 'Agregar documentación JSDoc a funciones públicas'
      });
    }
  }
  
  return issues;
};

// Análisis de estructura
const analyzeStructure = (code, config) => {
  const issues = [];
  let maxNesting = 0;
  let complexity = 1; // Complejidad ciclomática base
  
  // Calcular nivel de anidamiento
  const lines = code.split('\n');
  let currentNesting = 0;
  
  lines.forEach(line => {
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    currentNesting += openBraces - closeBraces;
    maxNesting = Math.max(maxNesting, currentNesting);
    
    // Calcular complejidad ciclomática
    const complexityKeywords = /\b(if|else|while|for|switch|case|catch|&&|\|\|)\b/g;
    const matches = line.match(complexityKeywords);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  // Verificar nivel de anidamiento
  if (maxNesting > config.maxNestingLevel) {
    issues.push({
      type: 'structure',
      severity: 'warning',
      message: `Nivel de anidamiento muy alto: ${maxNesting} (máximo recomendado: ${config.maxNestingLevel})`,
      suggestion: 'Refactorizar para reducir anidamiento usando early returns o funciones auxiliares'
    });
  }
  
  return { issues, maxNesting, complexity };
};

// Generar recomendaciones basadas en análisis
const generateRecommendations = (issues, metrics, config) => {
  const recommendations = [];
  
  // Recomendaciones basadas en métricas
  if (metrics.linesOfCode > 300) {
    recommendations.push({
      type: 'refactoring',
      priority: 'high',
      message: 'Archivo muy grande, considerar dividir en módulos más pequeños',
      action: 'Dividir archivo en múltiples archivos especializados'
    });
  }
  
  if (metrics.cyclomaticComplexity > 10) {
    recommendations.push({
      type: 'complexity',
      priority: 'medium',
      message: 'Complejidad ciclomática alta, dificulta el mantenimiento',
      action: 'Simplificar lógica condicional y extraer funciones'
    });
  }
  
  if (metrics.functionCount > 20) {
    recommendations.push({
      type: 'organization',
      priority: 'medium',
      message: 'Muchas funciones en un archivo, considerar mejor organización',
      action: 'Agrupar funciones relacionadas en módulos separados'
    });
  }
  
  // Recomendaciones basadas en tipos de issues
  const issueTypes = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});
  
  if (issueTypes.naming > 5) {
    recommendations.push({
      type: 'naming',
      priority: 'medium',
      message: 'Múltiples problemas de nomenclatura detectados',
      action: 'Revisar y estandarizar convenciones de nomenclatura'
    });
  }
  
  if (issueTypes.function > 3) {
    recommendations.push({
      type: 'function',
      priority: 'high',
      message: 'Varias funciones necesitan refactoring',
      action: 'Aplicar principio de responsabilidad única a las funciones'
    });
  }
  
  return recommendations;
};

// Calcular puntuación de legibilidad
const calculateReadabilityScore = (issues, metrics) => {
  let score = 100;
  
  // Penalizar por issues
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'error':
        score -= 10;
        break;
      case 'warning':
        score -= 5;
        break;
      case 'info':
        score -= 2;
        break;
    }
  });
  
  // Penalizar por métricas altas
  if (metrics.cyclomaticComplexity > 10) {
    score -= (metrics.cyclomaticComplexity - 10) * 2;
  }
  
  if (metrics.nestingLevel > 4) {
    score -= (metrics.nestingLevel - 4) * 5;
  }
  
  if (metrics.linesOfCode > 200) {
    score -= Math.floor((metrics.linesOfCode - 200) / 50) * 3;
  }
  
  return Math.max(0, Math.min(100, score));
};

// Utilidades de nomenclatura
export const namingUtils = {
  // Convertir a camelCase
  toCamelCase: (str) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  },
  
  // Convertir a PascalCase
  toPascalCase: (str) => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '');
  },
  
  // Convertir a kebab-case
  toKebabCase: (str) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  },
  
  // Convertir a snake_case
  toSnakeCase: (str) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  },
  
  // Validar nombre de variable
  isValidVariableName: (name) => {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
  },
  
  // Sugerir nombre más descriptivo
  suggestDescriptiveName: (context, currentName) => {
    const suggestions = {
      'data': ['userData', 'formData', 'responseData', 'configData'],
      'info': ['userInfo', 'systemInfo', 'debugInfo', 'metaInfo'],
      'item': ['listItem', 'menuItem', 'dataItem', 'selectedItem'],
      'obj': ['userObject', 'configObject', 'responseObject'],
      'temp': ['temporaryValue', 'tempResult', 'tempData'],
      'var': ['variable', 'value', 'result']
    };
    
    return suggestions[currentName.toLowerCase()] || [`${context}${namingUtils.toPascalCase(currentName)}`];
  }
};

// Utilidades de documentación
export const documentationUtils = {
  // Generar JSDoc para función
  generateJSDoc: (functionSignature, description = '') => {
    const paramMatch = functionSignature.match(/\(([^)]*)\)/);
    const params = paramMatch ? paramMatch[1].split(',').filter(p => p.trim()) : [];
    
    let jsDoc = '/**\n';
    jsDoc += ` * ${description || 'Descripción de la función'}\n`;
    
    params.forEach(param => {
      const paramName = param.trim().split(/[\s=]/)[0];
      jsDoc += ` * @param {*} ${paramName} - Descripción del parámetro\n`;
    });
    
    jsDoc += ' * @returns {*} Descripción del valor de retorno\n';
    jsDoc += ' */\n';
    
    return jsDoc;
  },
  
  // Generar comentario de componente React
  generateComponentDoc: (componentName, props = []) => {
    let doc = '/**\n';
    doc += ` * Componente ${componentName}\n`;
    doc += ' * \n';
    doc += ' * @component\n';
    
    if (props.length > 0) {
      doc += ' * @param {Object} props - Propiedades del componente\n';
      props.forEach(prop => {
        doc += ` * @param {*} props.${prop} - Descripción de ${prop}\n`;
      });
    }
    
    doc += ' * @returns {JSX.Element} Elemento JSX renderizado\n';
    doc += ' */\n';
    
    return doc;
  },
  
  // Generar README para módulo
  generateModuleReadme: (moduleName, description, functions = []) => {
    let readme = `# ${moduleName}\n\n`;
    readme += `${description}\n\n`;
    readme += '## Instalación\n\n';
    readme += '```javascript\n';
    readme += `import { ${functions.join(', ')} } from './${moduleName}';\n`;
    readme += '```\n\n';
    readme += '## Funciones\n\n';
    
    functions.forEach(func => {
      readme += `### ${func}\n\n`;
      readme += 'Descripción de la función.\n\n';
      readme += '```javascript\n';
      readme += `${func}(param1, param2)\n`;
      readme += '```\n\n';
    });
    
    return readme;
  }
};

// Utilidades de formateo
export const formattingUtils = {
  // Formatear código JavaScript básico
  formatCode: (code) => {
    return code
      .replace(/;\s*\n/g, ';\n') // Normalizar punto y coma
      .replace(/\{\s*\n/g, '{\n') // Normalizar llaves de apertura
      .replace(/\n\s*\}/g, '\n}') // Normalizar llaves de cierre
      .replace(/,\s*\n/g, ',\n') // Normalizar comas
      .replace(/\n\s*\n\s*\n/g, '\n\n'); // Eliminar líneas vacías múltiples
  },
  
  // Organizar imports
  organizeImports: (code) => {
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
    
    // Ordenar imports: React primero, luego librerías, luego relativos
    imports.sort((a, b) => {
      const aIsReact = a.includes('react');
      const bIsReact = b.includes('react');
      const aIsRelative = a.includes('./');
      const bIsRelative = b.includes('./');
      
      if (aIsReact && !bIsReact) return -1;
      if (!aIsReact && bIsReact) return 1;
      if (aIsRelative && !bIsRelative) return 1;
      if (!aIsRelative && bIsRelative) return -1;
      
      return a.localeCompare(b);
    });
    
    return [...imports, '', ...otherLines].join('\n');
  },
  
  // Agregar espaciado consistente
  addConsistentSpacing: (code) => {
    return code
      .replace(/([{}])\n(?!\n)/g, '$1\n\n') // Espacio después de bloques
      .replace(/\n\n\n+/g, '\n\n') // Máximo dos líneas vacías
      .replace(/(function|const|let|var)\s+/g, '$1 ') // Espacio después de palabras clave
      .replace(/([,;])(?!\s)/g, '$1 '); // Espacio después de comas y punto y coma
  }
};

// Componente de análisis de legibilidad
export const ReadabilityAnalyzer = ({ code, filename, onAnalysisComplete }) => {
  const { analyzeCode, getRecommendations } = useReadability();
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = analyzeCode(code, filename);
      setAnalysis(result);
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (error) {
      console.error('Error en análisis de legibilidad:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (code && filename) {
      performAnalysis();
    }
  }, [code, filename]);

  if (isAnalyzing) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="animate-pulse">Analizando legibilidad...</div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Análisis de Legibilidad</h3>
        <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
          {analysis.score}/100
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Líneas de código</div>
          <div className="text-xl font-semibold">{analysis.metrics.linesOfCode}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Complejidad</div>
          <div className="text-xl font-semibold">{analysis.metrics.cyclomaticComplexity}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Funciones</div>
          <div className="text-xl font-semibold">{analysis.metrics.functionCount}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Anidamiento</div>
          <div className="text-xl font-semibold">{analysis.metrics.nestingLevel}</div>
        </div>
      </div>
      
      {analysis.issues.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Problemas Detectados ({analysis.issues.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {analysis.issues.map((issue, index) => (
              <div key={index} className="p-2 bg-red-50 border-l-4 border-red-400 text-sm">
                <div className="font-medium">{issue.message}</div>
                {issue.suggestion && (
                  <div className="text-gray-600 mt-1">{issue.suggestion}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Recomendaciones ({analysis.recommendations.length})</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="p-2 bg-blue-50 border-l-4 border-blue-400 text-sm">
                <div className="font-medium">{rec.message}</div>
                <div className="text-gray-600 mt-1">{rec.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  ReadabilityProvider,
  useReadability,
  namingUtils,
  documentationUtils,
  formattingUtils,
  ReadabilityAnalyzer
};