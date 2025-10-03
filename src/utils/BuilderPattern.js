// Builder Pattern para configuraciones complejas

// Builder para configuración de formularios
class FormConfigBuilder {
  constructor() {
    this.config = {
      fields: [],
      validation: {},
      layout: 'vertical',
      submitButton: { text: 'Enviar', disabled: false },
      resetButton: { show: false, text: 'Limpiar' },
      steps: [],
      onSubmit: null,
      onReset: null,
      onChange: null,
      className: '',
      autoSave: false,
      showProgress: false
    };
  }

  addField(field) {
    this.config.fields.push({
      id: field.id || field.name,
      name: field.name,
      type: field.type || 'text',
      label: field.label,
      placeholder: field.placeholder || '',
      required: field.required || false,
      disabled: field.disabled || false,
      options: field.options || [],
      validation: field.validation || {},
      className: field.className || '',
      helpText: field.helpText || '',
      defaultValue: field.defaultValue || '',
      ...field
    });
    return this;
  }

  addTextField(name, label, options = {}) {
    return this.addField({
      name,
      label,
      type: 'text',
      ...options
    });
  }

  addEmailField(name, label, options = {}) {
    return this.addField({
      name,
      label,
      type: 'email',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Ingrese un email válido'
      },
      ...options
    });
  }

  addSelectField(name, label, options, fieldOptions = {}) {
    return this.addField({
      name,
      label,
      type: 'select',
      options,
      ...fieldOptions
    });
  }

  addRadioGroup(name, label, options, fieldOptions = {}) {
    return this.addField({
      name,
      label,
      type: 'radio',
      options,
      ...fieldOptions
    });
  }

  addCheckboxField(name, label, options = {}) {
    return this.addField({
      name,
      label,
      type: 'checkbox',
      ...options
    });
  }

  addTextareaField(name, label, options = {}) {
    return this.addField({
      name,
      label,
      type: 'textarea',
      rows: 4,
      ...options
    });
  }

  addNumberField(name, label, options = {}) {
    return this.addField({
      name,
      label,
      type: 'number',
      min: options.min || 0,
      max: options.max || 100,
      step: options.step || 1,
      ...options
    });
  }

  addDateField(name, label, options = {}) {
    return this.addField({
      name,
      label,
      type: 'date',
      ...options
    });
  }

  setLayout(layout) {
    this.config.layout = layout; // 'vertical', 'horizontal', 'grid'
    return this;
  }

  setValidation(fieldName, validation) {
    this.config.validation[fieldName] = validation;
    return this;
  }

  setGlobalValidation(validation) {
    this.config.globalValidation = validation;
    return this;
  }

  setSubmitButton(text, options = {}) {
    this.config.submitButton = {
      text,
      disabled: options.disabled || false,
      className: options.className || '',
      loading: options.loading || false,
      ...options
    };
    return this;
  }

  enableResetButton(text = 'Limpiar', options = {}) {
    this.config.resetButton = {
      show: true,
      text,
      className: options.className || '',
      ...options
    };
    return this;
  }

  addStep(step) {
    this.config.steps.push({
      id: step.id || `step-${this.config.steps.length + 1}`,
      title: step.title,
      description: step.description || '',
      fields: step.fields || [],
      validation: step.validation || {},
      ...step
    });
    return this;
  }

  enableMultiStep() {
    this.config.multiStep = true;
    this.config.showProgress = true;
    return this;
  }

  setEventHandlers(handlers) {
    if (handlers.onSubmit) this.config.onSubmit = handlers.onSubmit;
    if (handlers.onReset) this.config.onReset = handlers.onReset;
    if (handlers.onChange) this.config.onChange = handlers.onChange;
    if (handlers.onStepChange) this.config.onStepChange = handlers.onStepChange;
    return this;
  }

  enableAutoSave(interval = 30000) {
    this.config.autoSave = true;
    this.config.autoSaveInterval = interval;
    return this;
  }

  setClassName(className) {
    this.config.className = className;
    return this;
  }

  enableProgress() {
    this.config.showProgress = true;
    return this;
  }

  build() {
    // Validar configuración antes de construir
    if (this.config.fields.length === 0 && this.config.steps.length === 0) {
      throw new Error('El formulario debe tener al menos un campo o paso');
    }

    // Si es multi-step, mover campos a steps si no hay steps definidos
    if (this.config.multiStep && this.config.steps.length === 0 && this.config.fields.length > 0) {
      this.config.steps.push({
        id: 'step-1',
        title: 'Información',
        fields: [...this.config.fields]
      });
      this.config.fields = [];
    }

    return { ...this.config };
  }
}

// Builder para configuración de Dashboard
class DashboardConfigBuilder {
  constructor() {
    this.config = {
      title: '',
      layout: 'grid',
      columns: 12,
      widgets: [],
      filters: [],
      refreshInterval: 0,
      exportOptions: [],
      theme: 'light',
      responsive: true,
      className: ''
    };
  }

  setTitle(title) {
    this.config.title = title;
    return this;
  }

  setLayout(layout, columns = 12) {
    this.config.layout = layout; // 'grid', 'flex', 'masonry'
    this.config.columns = columns;
    return this;
  }

  addWidget(widget) {
    this.config.widgets.push({
      id: widget.id || `widget-${this.config.widgets.length + 1}`,
      type: widget.type,
      title: widget.title,
      size: widget.size || { width: 6, height: 4 },
      position: widget.position || { x: 0, y: 0 },
      props: widget.props || {},
      dataSource: widget.dataSource || null,
      refreshInterval: widget.refreshInterval || 0,
      ...widget
    });
    return this;
  }

  addStatCard(title, value, options = {}) {
    return this.addWidget({
      type: 'stat-card',
      title,
      props: {
        value,
        trend: options.trend || null,
        icon: options.icon || null,
        color: options.color || 'blue',
        format: options.format || 'number'
      },
      size: options.size || { width: 3, height: 2 },
      ...options
    });
  }

  addChart(type, title, dataSource, options = {}) {
    return this.addWidget({
      type: 'chart',
      title,
      dataSource,
      props: {
        chartType: type, // 'bar', 'line', 'pie', 'area'
        xAxis: options.xAxis || 'x',
        yAxis: options.yAxis || 'y',
        colors: options.colors || [],
        showLegend: options.showLegend !== false,
        showGrid: options.showGrid !== false
      },
      size: options.size || { width: 6, height: 4 },
      ...options
    });
  }

  addTable(title, dataSource, columns, options = {}) {
    return this.addWidget({
      type: 'table',
      title,
      dataSource,
      props: {
        columns,
        pagination: options.pagination !== false,
        sorting: options.sorting !== false,
        filtering: options.filtering || false,
        pageSize: options.pageSize || 10
      },
      size: options.size || { width: 12, height: 6 },
      ...options
    });
  }

  addFilter(filter) {
    this.config.filters.push({
      id: filter.id || filter.name,
      name: filter.name,
      type: filter.type || 'select',
      label: filter.label,
      options: filter.options || [],
      defaultValue: filter.defaultValue || null,
      multiple: filter.multiple || false,
      ...filter
    });
    return this;
  }

  addDateRangeFilter(name, label, defaultRange = null) {
    return this.addFilter({
      name,
      label,
      type: 'date-range',
      defaultValue: defaultRange
    });
  }

  addSelectFilter(name, label, options, multiple = false) {
    return this.addFilter({
      name,
      label,
      type: 'select',
      options,
      multiple
    });
  }

  addSearchFilter(name, label, placeholder = 'Buscar...') {
    return this.addFilter({
      name,
      label,
      type: 'search',
      placeholder
    });
  }

  setRefreshInterval(interval) {
    this.config.refreshInterval = interval;
    return this;
  }

  enableExport(formats = ['csv', 'pdf', 'excel']) {
    this.config.exportOptions = formats;
    return this;
  }

  setTheme(theme) {
    this.config.theme = theme; // 'light', 'dark', 'auto'
    return this;
  }

  setResponsive(responsive = true) {
    this.config.responsive = responsive;
    return this;
  }

  setClassName(className) {
    this.config.className = className;
    return this;
  }

  build() {
    if (this.config.widgets.length === 0) {
      throw new Error('El dashboard debe tener al menos un widget');
    }

    return { ...this.config };
  }
}

// Builder para configuración de Gráficos
class ChartConfigBuilder {
  constructor(type) {
    this.config = {
      type,
      data: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            enabled: true
          }
        },
        scales: {},
        animation: {
          duration: 1000
        }
      },
      colors: [],
      className: ''
    };
  }

  setData(data) {
    this.config.data = data;
    return this;
  }

  setColors(colors) {
    this.config.colors = colors;
    return this;
  }

  setTitle(title) {
    this.config.options.plugins.title = {
      display: true,
      text: title
    };
    return this;
  }

  setLegend(show = true, position = 'top') {
    this.config.options.plugins.legend = {
      display: show,
      position
    };
    return this;
  }

  setTooltip(enabled = true, options = {}) {
    this.config.options.plugins.tooltip = {
      enabled,
      ...options
    };
    return this;
  }

  setXAxis(options) {
    this.config.options.scales.x = {
      display: true,
      title: {
        display: !!options.title,
        text: options.title || ''
      },
      grid: {
        display: options.showGrid !== false
      },
      ...options
    };
    return this;
  }

  setYAxis(options) {
    this.config.options.scales.y = {
      display: true,
      title: {
        display: !!options.title,
        text: options.title || ''
      },
      grid: {
        display: options.showGrid !== false
      },
      beginAtZero: options.beginAtZero !== false,
      ...options
    };
    return this;
  }

  setAnimation(duration = 1000, easing = 'easeInOutQuart') {
    this.config.options.animation = {
      duration,
      easing
    };
    return this;
  }

  setResponsive(responsive = true, maintainAspectRatio = false) {
    this.config.options.responsive = responsive;
    this.config.options.maintainAspectRatio = maintainAspectRatio;
    return this;
  }

  addPlugin(plugin) {
    if (!this.config.options.plugins.custom) {
      this.config.options.plugins.custom = [];
    }
    this.config.options.plugins.custom.push(plugin);
    return this;
  }

  setClassName(className) {
    this.config.className = className;
    return this;
  }

  build() {
    return { ...this.config };
  }
}

// Builder para configuración de Validación
class ValidationConfigBuilder {
  constructor() {
    this.config = {
      rules: {},
      messages: {},
      mode: 'onChange', // 'onChange', 'onBlur', 'onSubmit'
      reValidateMode: 'onChange',
      shouldFocusError: true,
      criteriaMode: 'firstError'
    };
  }

  addRule(fieldName, rule) {
    if (!this.config.rules[fieldName]) {
      this.config.rules[fieldName] = {};
    }
    Object.assign(this.config.rules[fieldName], rule);
    return this;
  }

  required(fieldName, message = 'Este campo es requerido') {
    return this.addRule(fieldName, {
      required: {
        value: true,
        message
      }
    });
  }

  minLength(fieldName, length, message) {
    return this.addRule(fieldName, {
      minLength: {
        value: length,
        message: message || `Mínimo ${length} caracteres`
      }
    });
  }

  maxLength(fieldName, length, message) {
    return this.addRule(fieldName, {
      maxLength: {
        value: length,
        message: message || `Máximo ${length} caracteres`
      }
    });
  }

  pattern(fieldName, regex, message) {
    return this.addRule(fieldName, {
      pattern: {
        value: regex,
        message: message || 'Formato inválido'
      }
    });
  }

  email(fieldName, message = 'Ingrese un email válido') {
    return this.pattern(
      fieldName,
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message
    );
  }

  min(fieldName, value, message) {
    return this.addRule(fieldName, {
      min: {
        value,
        message: message || `Valor mínimo: ${value}`
      }
    });
  }

  max(fieldName, value, message) {
    return this.addRule(fieldName, {
      max: {
        value,
        message: message || `Valor máximo: ${value}`
      }
    });
  }

  custom(fieldName, validator, message) {
    return this.addRule(fieldName, {
      validate: {
        custom: (value) => validator(value) || message
      }
    });
  }

  setMode(mode) {
    this.config.mode = mode;
    return this;
  }

  setReValidateMode(mode) {
    this.config.reValidateMode = mode;
    return this;
  }

  setFocusError(shouldFocus = true) {
    this.config.shouldFocusError = shouldFocus;
    return this;
  }

  build() {
    return { ...this.config };
  }
}

// Factory para crear builders
class BuilderFactory {
  static createFormBuilder() {
    return new FormConfigBuilder();
  }

  static createDashboardBuilder() {
    return new DashboardConfigBuilder();
  }

  static createChartBuilder(type) {
    return new ChartConfigBuilder(type);
  }

  static createValidationBuilder() {
    return new ValidationConfigBuilder();
  }

  // Métodos de conveniencia para configuraciones comunes
  static createQuestionnaireForm() {
    return new FormConfigBuilder()
      .enableMultiStep()
      .enableProgress()
      .setLayout('vertical')
      .setSubmitButton('Enviar Cuestionario')
      .enableResetButton('Limpiar Formulario');
  }

  static createDashboardWithFilters() {
    return new DashboardConfigBuilder()
      .setLayout('grid', 12)
      .addDateRangeFilter('dateRange', 'Rango de Fechas')
      .addSelectFilter('area', 'Área', [])
      .enableExport(['csv', 'pdf'])
      .setRefreshInterval(300000); // 5 minutos
  }

  static createBarChart() {
    return new ChartConfigBuilder('bar')
      .setResponsive(true)
      .setLegend(true, 'top')
      .setAnimation(1000);
  }

  static createPieChart() {
    return new ChartConfigBuilder('pie')
      .setResponsive(true)
      .setLegend(true, 'right')
      .setAnimation(1500);
  }
}

// Ejemplos de uso predefinidos
export const QuestionnaireFormConfig = BuilderFactory
  .createQuestionnaireForm()
  .addStep({
    id: 'personal-info',
    title: 'Información Personal',
    fields: ['nombre', 'apellido', 'documento']
  })
  .addStep({
    id: 'questionnaire',
    title: 'Cuestionario',
    fields: ['responses']
  })
  .build();

export const DashboardConfig = BuilderFactory
  .createDashboardWithFilters()
  .setTitle('Dashboard de Seguridad')
  .addStatCard('Total Usuarios', 0, { color: 'blue', icon: 'users' })
  .addStatCard('Respuestas Completadas', 0, { color: 'green', icon: 'check' })
  .addChart('bar', 'Respuestas por Área', 'responses-by-area')
  .addChart('pie', 'Distribución por Género', 'gender-distribution')
  .build();

export {
  FormConfigBuilder,
  DashboardConfigBuilder,
  ChartConfigBuilder,
  ValidationConfigBuilder,
  BuilderFactory
};

export default BuilderFactory;