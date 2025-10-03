// Command Pattern para manejo de acciones y operaciones

// Interfaz base para comandos
class Command {
  execute() {
    throw new Error('El método execute debe ser implementado');
  }

  undo() {
    throw new Error('El método undo debe ser implementado');
  }

  canUndo() {
    return true;
  }

  getDescription() {
    return 'Comando genérico';
  }
}

// Comando para actualizar datos de formulario
class UpdateFormDataCommand extends Command {
  constructor(formState, fieldName, newValue, oldValue) {
    super();
    this.formState = formState;
    this.fieldName = fieldName;
    this.newValue = newValue;
    this.oldValue = oldValue;
    this.timestamp = Date.now();
  }

  execute() {
    this.formState.setFieldValue(this.fieldName, this.newValue);
    return {
      success: true,
      message: `Campo ${this.fieldName} actualizado`,
      data: { [this.fieldName]: this.newValue }
    };
  }

  undo() {
    this.formState.setFieldValue(this.fieldName, this.oldValue);
    return {
      success: true,
      message: `Campo ${this.fieldName} restaurado`,
      data: { [this.fieldName]: this.oldValue }
    };
  }

  getDescription() {
    return `Actualizar ${this.fieldName}: ${this.oldValue} → ${this.newValue}`;
  }
}

// Comando para enviar formulario
class SubmitFormCommand extends Command {
  constructor(formData, apiService, onSuccess, onError) {
    super();
    this.formData = { ...formData };
    this.apiService = apiService;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.submissionId = null;
    this.timestamp = Date.now();
  }

  async execute() {
    try {
      const result = await this.apiService.submitForm(this.formData);
      this.submissionId = result.id;
      
      if (this.onSuccess) {
        this.onSuccess(result);
      }
      
      return {
        success: true,
        message: 'Formulario enviado exitosamente',
        data: result
      };
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      }
      
      return {
        success: false,
        message: 'Error al enviar formulario',
        error: error.message
      };
    }
  }

  async undo() {
    if (!this.submissionId) {
      return {
        success: false,
        message: 'No hay envío para deshacer'
      };
    }

    try {
      await this.apiService.deleteSubmission(this.submissionId);
      return {
        success: true,
        message: 'Envío de formulario deshecho'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al deshacer envío',
        error: error.message
      };
    }
  }

  canUndo() {
    return !!this.submissionId;
  }

  getDescription() {
    return `Enviar formulario (${Object.keys(this.formData).length} campos)`;
  }
}

// Comando para filtrar datos del dashboard
class FilterDashboardCommand extends Command {
  constructor(dashboardState, filterName, filterValue, previousValue) {
    super();
    this.dashboardState = dashboardState;
    this.filterName = filterName;
    this.filterValue = filterValue;
    this.previousValue = previousValue;
    this.timestamp = Date.now();
  }

  execute() {
    this.dashboardState.setFilter(this.filterName, this.filterValue);
    return {
      success: true,
      message: `Filtro ${this.filterName} aplicado`,
      data: { [this.filterName]: this.filterValue }
    };
  }

  undo() {
    this.dashboardState.setFilter(this.filterName, this.previousValue);
    return {
      success: true,
      message: `Filtro ${this.filterName} restaurado`,
      data: { [this.filterName]: this.previousValue }
    };
  }

  getDescription() {
    return `Filtrar ${this.filterName}: ${this.previousValue} → ${this.filterValue}`;
  }
}

// Comando para exportar datos
class ExportDataCommand extends Command {
  constructor(data, format, filename, exportService) {
    super();
    this.data = data;
    this.format = format;
    this.filename = filename;
    this.exportService = exportService;
    this.exportedFile = null;
    this.timestamp = Date.now();
  }

  async execute() {
    try {
      const result = await this.exportService.export(this.data, this.format, this.filename);
      this.exportedFile = result.filename;
      
      return {
        success: true,
        message: `Datos exportados como ${this.format.toUpperCase()}`,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al exportar datos',
        error: error.message
      };
    }
  }

  async undo() {
    // En este caso, "deshacer" podría significar eliminar el archivo exportado
    // o simplemente notificar que la exportación fue deshecha
    return {
      success: true,
      message: 'Exportación deshecha (archivo puede permanecer en descargas)'
    };
  }

  canUndo() {
    return false; // Generalmente no se puede "deshacer" una exportación
  }

  getDescription() {
    return `Exportar ${this.data.length} registros como ${this.format.toUpperCase()}`;
  }
}

// Comando para cambiar paso en formulario multi-step
class ChangeStepCommand extends Command {
  constructor(formState, newStep, previousStep, validation = null) {
    super();
    this.formState = formState;
    this.newStep = newStep;
    this.previousStep = previousStep;
    this.validation = validation;
    this.timestamp = Date.now();
  }

  async execute() {
    // Validar paso actual si es necesario
    if (this.validation && this.newStep > this.previousStep) {
      const isValid = await this.validation();
      if (!isValid) {
        return {
          success: false,
          message: 'Debe completar los campos requeridos antes de continuar'
        };
      }
    }

    this.formState.setCurrentStep(this.newStep);
    return {
      success: true,
      message: `Paso cambiado a ${this.newStep}`,
      data: { currentStep: this.newStep }
    };
  }

  undo() {
    this.formState.setCurrentStep(this.previousStep);
    return {
      success: true,
      message: `Regresado al paso ${this.previousStep}`,
      data: { currentStep: this.previousStep }
    };
  }

  getDescription() {
    return `Cambiar paso: ${this.previousStep} → ${this.newStep}`;
  }
}

// Comando compuesto para múltiples operaciones
class CompositeCommand extends Command {
  constructor(commands, description = 'Operación múltiple') {
    super();
    this.commands = commands;
    this.description = description;
    this.executedCommands = [];
    this.timestamp = Date.now();
  }

  async execute() {
    const results = [];
    this.executedCommands = [];

    for (const command of this.commands) {
      try {
        const result = await command.execute();
        results.push(result);
        this.executedCommands.push(command);
        
        if (!result.success) {
          // Si un comando falla, deshacer los anteriores
          await this.undo();
          return {
            success: false,
            message: 'Error en operación múltiple',
            error: result.message || result.error
          };
        }
      } catch (error) {
        await this.undo();
        return {
          success: false,
          message: 'Error en operación múltiple',
          error: error.message
        };
      }
    }

    return {
      success: true,
      message: `${this.description} completada`,
      data: results
    };
  }

  async undo() {
    const results = [];
    
    // Deshacer en orden inverso
    for (let i = this.executedCommands.length - 1; i >= 0; i--) {
      const command = this.executedCommands[i];
      if (command.canUndo()) {
        try {
          const result = await command.undo();
          results.push(result);
        } catch (error) {
          console.error('Error al deshacer comando:', error);
        }
      }
    }

    this.executedCommands = [];
    return {
      success: true,
      message: `${this.description} deshecha`,
      data: results
    };
  }

  getDescription() {
    return this.description;
  }
}

// Invoker - Maneja la ejecución de comandos y el historial
class CommandInvoker {
  constructor(maxHistorySize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = maxHistorySize;
    this.listeners = [];
  }

  async executeCommand(command) {
    try {
      const result = await command.execute();
      
      if (result.success) {
        // Eliminar comandos posteriores al índice actual
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Agregar nuevo comando
        this.history.push({
          command,
          result,
          timestamp: Date.now()
        });
        
        // Mantener tamaño máximo del historial
        if (this.history.length > this.maxHistorySize) {
          this.history.shift();
        } else {
          this.currentIndex++;
        }
        
        this.notifyListeners('execute', { command, result });
      }
      
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Error al ejecutar comando',
        error: error.message
      };
      
      this.notifyListeners('error', { command, error: errorResult });
      return errorResult;
    }
  }

  async undo() {
    if (!this.canUndo()) {
      return {
        success: false,
        message: 'No hay comandos para deshacer'
      };
    }

    const historyItem = this.history[this.currentIndex];
    const { command } = historyItem;

    if (!command.canUndo()) {
      return {
        success: false,
        message: 'Este comando no se puede deshacer'
      };
    }

    try {
      const result = await command.undo();
      
      if (result.success) {
        this.currentIndex--;
        this.notifyListeners('undo', { command, result });
      }
      
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Error al deshacer comando',
        error: error.message
      };
      
      this.notifyListeners('error', { command, error: errorResult });
      return errorResult;
    }
  }

  async redo() {
    if (!this.canRedo()) {
      return {
        success: false,
        message: 'No hay comandos para rehacer'
      };
    }

    this.currentIndex++;
    const historyItem = this.history[this.currentIndex];
    const { command } = historyItem;

    try {
      const result = await command.execute();
      
      if (result.success) {
        this.notifyListeners('redo', { command, result });
      } else {
        this.currentIndex--; // Revertir si falla
      }
      
      return result;
    } catch (error) {
      this.currentIndex--; // Revertir si falla
      
      const errorResult = {
        success: false,
        message: 'Error al rehacer comando',
        error: error.message
      };
      
      this.notifyListeners('error', { command, error: errorResult });
      return errorResult;
    }
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  getHistory() {
    return this.history.map((item, index) => ({
      ...item,
      isCurrent: index === this.currentIndex,
      description: item.command.getDescription()
    }));
  }

  clearHistory() {
    this.history = [];
    this.currentIndex = -1;
    this.notifyListeners('clear', {});
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  notifyListeners(action, data) {
    this.listeners.forEach(listener => {
      try {
        listener(action, data);
      } catch (error) {
        console.error('Error en listener de comando:', error);
      }
    });
  }
}

// Factory para crear comandos comunes
class CommandFactory {
  static createUpdateFormData(formState, fieldName, newValue, oldValue) {
    return new UpdateFormDataCommand(formState, fieldName, newValue, oldValue);
  }

  static createSubmitForm(formData, apiService, onSuccess, onError) {
    return new SubmitFormCommand(formData, apiService, onSuccess, onError);
  }

  static createFilterDashboard(dashboardState, filterName, filterValue, previousValue) {
    return new FilterDashboardCommand(dashboardState, filterName, filterValue, previousValue);
  }

  static createExportData(data, format, filename, exportService) {
    return new ExportDataCommand(data, format, filename, exportService);
  }

  static createChangeStep(formState, newStep, previousStep, validation) {
    return new ChangeStepCommand(formState, newStep, previousStep, validation);
  }

  static createComposite(commands, description) {
    return new CompositeCommand(commands, description);
  }

  // Comandos compuestos comunes
  static createCompleteFormStep(formState, stepData, nextStep, currentStep) {
    const commands = [];
    
    // Actualizar datos del paso
    Object.entries(stepData).forEach(([fieldName, value]) => {
      commands.push(
        new UpdateFormDataCommand(formState, fieldName, value, formState.getFieldValue(fieldName))
      );
    });
    
    // Cambiar al siguiente paso
    commands.push(
      new ChangeStepCommand(formState, nextStep, currentStep)
    );
    
    return new CompositeCommand(commands, `Completar paso ${currentStep}`);
  }

  static createBulkFilter(dashboardState, filters) {
    const commands = filters.map(({ name, value, previousValue }) => 
      new FilterDashboardCommand(dashboardState, name, value, previousValue)
    );
    
    return new CompositeCommand(commands, 'Aplicar filtros múltiples');
  }
}

// Hook de React para usar el patrón Command
import { useRef, useCallback, useState, useEffect } from 'react';

export const useCommandInvoker = (maxHistorySize = 50) => {
  const invokerRef = useRef(new CommandInvoker(maxHistorySize));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [history, setHistory] = useState([]);

  const updateState = useCallback(() => {
    const invoker = invokerRef.current;
    setCanUndo(invoker.canUndo());
    setCanRedo(invoker.canRedo());
    setHistory(invoker.getHistory());
  }, []);

  useEffect(() => {
    const invoker = invokerRef.current;
    
    const listener = () => {
      updateState();
    };
    
    invoker.addListener(listener);
    
    return () => {
      invoker.removeListener(listener);
    };
  }, [updateState]);

  const executeCommand = useCallback(async (command) => {
    const result = await invokerRef.current.executeCommand(command);
    return result;
  }, []);

  const undo = useCallback(async () => {
    const result = await invokerRef.current.undo();
    return result;
  }, []);

  const redo = useCallback(async () => {
    const result = await invokerRef.current.redo();
    return result;
  }, []);

  const clearHistory = useCallback(() => {
    invokerRef.current.clearHistory();
  }, []);

  return {
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
    clearHistory
  };
};

export {
  Command,
  UpdateFormDataCommand,
  SubmitFormCommand,
  FilterDashboardCommand,
  ExportDataCommand,
  ChangeStepCommand,
  CompositeCommand,
  CommandInvoker,
  CommandFactory
};

export default {
  Command,
  CommandInvoker,
  CommandFactory,
  useCommandInvoker
};