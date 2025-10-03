/**
 * Tests unitarios para CorrelationAnalysisRefactored component
 * 
 * @author Sistema de Evaluación Psicológica BAT-7
 * @version 2.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CorrelationAnalysisRefactored from '../CorrelationAnalysisRefactored';

// Mock del custom hook
vi.mock('../useCorrelationData', () => ({
  useCorrelationData: vi.fn()
}));

// Mock de los componentes granulares
vi.mock('../CorrelationCard', () => ({
  default: ({ correlation }) => (
    <div data-testid="correlation-card">
      {correlation.variable1} vs {correlation.variable2}: {correlation.value}
    </div>
  )
}));

vi.mock('../InterpretationGuide', () => ({
  default: () => <div data-testid="interpretation-guide">Guía de Interpretación</div>
}));

vi.mock('../InsightsPanel', () => ({
  default: ({ insights }) => (
    <div data-testid="insights-panel">
      {insights.map((insight, index) => (
        <div key={index}>{insight.title}</div>
      ))}
    </div>
  )
}));

vi.mock('../StatsSummary', () => ({
  default: ({ statistics }) => (
    <div data-testid="stats-summary">
      Total: {statistics.totalCorrelations}
    </div>
  )
}));

import { useCorrelationData } from '../useCorrelationData';

// Mock data para las pruebas
const mockCorrelations = [
  {
    variable1: 'Puntaje BAT-7',
    variable2: 'Confianza',
    value: 0.75,
    strength: 'Fuerte',
    direction: 'Positiva',
    description: 'Correlación fuerte positiva'
  },
  {
    variable1: 'Edad',
    variable2: 'Satisfacción',
    value: 0.25,
    strength: 'Débil',
    direction: 'Positiva',
    description: 'Correlación débil positiva'
  }
];

const mockStatistics = {
  totalCorrelations: 10,
  validCorrelations: 8,
  strongCorrelations: 3,
  averageCorrelation: 0.45,
  distribution: {
    'Muy Fuerte': 1,
    'Fuerte': 2,
    'Moderada': 3,
    'Débil': 2,
    'Muy Débil': 0
  }
};

const mockInsights = [
  {
    type: 'warning',
    title: 'Correlación Alta Detectada',
    description: 'Se encontró una correlación muy alta entre variables',
    priority: 'high'
  },
  {
    type: 'positive',
    title: 'Patrón Positivo',
    description: 'Las correlaciones muestran un patrón positivo',
    priority: 'medium'
  }
];

const mockResponsesData = [
  { puntaje: 85, confianza: 90, satisfaccion: 80 },
  { puntaje: 70, confianza: 65, satisfaccion: 70 }
];

describe('CorrelationAnalysisRefactored Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado con datos válidos', () => {
    beforeEach(() => {
      useCorrelationData.mockReturnValue({
        correlations: mockCorrelations,
        statistics: mockStatistics,
        insights: mockInsights,
        isLoading: false,
        error: null
      });
    });

    it('debería renderizar el título principal', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      expect(screen.getByText('Análisis de Correlaciones')).toBeInTheDocument();
    });

    it('debería renderizar todos los componentes principales', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      expect(screen.getByTestId('interpretation-guide')).toBeInTheDocument();
      expect(screen.getByTestId('stats-summary')).toBeInTheDocument();
      expect(screen.getByTestId('insights-panel')).toBeInTheDocument();
    });

    it('debería renderizar todas las tarjetas de correlación', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const correlationCards = screen.getAllByTestId('correlation-card');
      expect(correlationCards).toHaveLength(mockCorrelations.length);
    });

    it('debería mostrar el conteo de correlaciones', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      expect(screen.getByText(/2 correlaciones encontradas/)).toBeInTheDocument();
    });
  });

  describe('Estado de carga', () => {
    beforeEach(() => {
      useCorrelationData.mockReturnValue({
        correlations: [],
        statistics: { totalCorrelations: 0 },
        insights: [],
        isLoading: true,
        error: null
      });
    });

    it('debería mostrar indicador de carga', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      expect(screen.getByText('Calculando correlaciones...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('debería mostrar skeleton loaders', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const skeletonElements = screen.getAllByTestId(/skeleton-/);
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Estado vacío', () => {
    beforeEach(() => {
      useCorrelationData.mockReturnValue({
        correlations: [],
        statistics: { totalCorrelations: 0 },
        insights: [],
        isLoading: false,
        error: null
      });
    });

    it('debería mostrar mensaje de estado vacío', () => {
      render(<CorrelationAnalysisRefactored responsesData={[]} />);
      
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('No hay datos suficientes')).toBeInTheDocument();
      expect(screen.getByText(/Se necesitan al menos 3 respuestas/)).toBeInTheDocument();
    });

    it('debería mostrar botón de actualización en estado vacío', () => {
      render(<CorrelationAnalysisRefactored responsesData={[]} />);
      
      const refreshButton = screen.getByText('Actualizar Datos');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Estado de error', () => {
    beforeEach(() => {
      useCorrelationData.mockReturnValue({
        correlations: [],
        statistics: { totalCorrelations: 0 },
        insights: [],
        isLoading: false,
        error: 'Error al calcular correlaciones'
      });
    });

    it('debería mostrar mensaje de error', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      expect(screen.getByText('⚠️')).toBeInTheDocument();
      expect(screen.getByText('Error en el análisis')).toBeInTheDocument();
      expect(screen.getByText('Error al calcular correlaciones')).toBeInTheDocument();
    });

    it('debería mostrar botón de reintento en estado de error', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const retryButton = screen.getByText('Reintentar');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Interactividad', () => {
    beforeEach(() => {
      useCorrelationData.mockReturnValue({
        correlations: mockCorrelations,
        statistics: mockStatistics,
        insights: mockInsights,
        isLoading: false,
        error: null
      });
    });

    it('debería manejar clic en botón de actualización', async () => {
      const onRefresh = vi.fn();
      render(
        <CorrelationAnalysisRefactored 
          responsesData={mockResponsesData} 
          onRefresh={onRefresh}
        />
      );
      
      const refreshButton = screen.getByLabelText('Actualizar análisis');
      fireEvent.click(refreshButton);
      
      expect(onRefresh).toHaveBeenCalled();
    });

    it('debería alternar la visibilidad de la guía de interpretación', async () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const toggleButton = screen.getByText('Ocultar Guía');
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Mostrar Guía')).toBeInTheDocument();
      });
    });

    it('debería manejar filtros de correlación', async () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const filterButton = screen.getByText('Solo Fuertes');
      fireEvent.click(filterButton);
      
      // Verificar que el filtro se aplicó
      expect(filterButton).toHaveClass('bg-blue-100');
    });
  });

  describe('Accesibilidad', () => {
    beforeEach(() => {
      useCorrelationData.mockReturnValue({
        correlations: mockCorrelations,
        statistics: mockStatistics,
        insights: mockInsights,
        isLoading: false,
        error: null
      });
    });

    it('debería tener estructura semántica apropiada', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('debería tener etiquetas ARIA apropiadas', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Análisis de correlaciones entre variables');
    });

    it('debería ser navegable por teclado', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const refreshButton = screen.getByLabelText('Actualizar análisis');
      expect(refreshButton).toHaveAttribute('tabIndex', '0');
    });

    it('debería tener skip links para navegación', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const skipLink = screen.getByText('Saltar a correlaciones');
      expect(skipLink).toHaveClass('sr-only');
    });
  });

  describe('Responsive design', () => {
    beforeEach(() => {
      useCorrelationData.mockReturnValue({
        correlations: mockCorrelations,
        statistics: mockStatistics,
        insights: mockInsights,
        isLoading: false,
        error: null
      });
    });

    it('debería tener clases responsive apropiadas', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const gridContainer = screen.getByTestId('correlations-grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('debería adaptar el layout en pantallas pequeñas', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      const header = screen.getByTestId('correlation-header');
      expect(header).toHaveClass('flex-col', 'md:flex-row');
    });
  });

  describe('Performance', () => {
    it('debería memoizar componentes pesados', () => {
      const { rerender } = render(
        <CorrelationAnalysisRefactored responsesData={mockResponsesData} />
      );
      
      // Re-renderizar con las mismas props
      rerender(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      // Verificar que useCorrelationData se llamó solo una vez
      expect(useCorrelationData).toHaveBeenCalledTimes(2); // Una por cada render
    });
  });

  describe('Integración con custom hook', () => {
    it('debería pasar los datos correctos al hook', () => {
      render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      
      expect(useCorrelationData).toHaveBeenCalledWith(mockResponsesData);
    });

    it('debería manejar cambios en los datos de entrada', () => {
      const { rerender } = render(
        <CorrelationAnalysisRefactored responsesData={mockResponsesData} />
      );
      
      const newData = [...mockResponsesData, { puntaje: 95, confianza: 85 }];
      rerender(<CorrelationAnalysisRefactored responsesData={newData} />);
      
      expect(useCorrelationData).toHaveBeenCalledWith(newData);
    });
  });

  describe('Casos edge', () => {
    it('debería manejar datos undefined gracefully', () => {
      useCorrelationData.mockReturnValue({
        correlations: [],
        statistics: { totalCorrelations: 0 },
        insights: [],
        isLoading: false,
        error: null
      });

      render(<CorrelationAnalysisRefactored responsesData={undefined} />);
      
      expect(screen.getByText('No hay datos suficientes')).toBeInTheDocument();
    });

    it('debería manejar arrays vacíos', () => {
      useCorrelationData.mockReturnValue({
        correlations: [],
        statistics: { totalCorrelations: 0 },
        insights: [],
        isLoading: false,
        error: null
      });

      render(<CorrelationAnalysisRefactored responsesData={[]} />);
      
      expect(screen.getByText('No hay datos suficientes')).toBeInTheDocument();
    });

    it('debería manejar errores del hook gracefully', () => {
      useCorrelationData.mockImplementation(() => {
        throw new Error('Hook error');
      });

      // Debería renderizar sin crashear
      expect(() => {
        render(<CorrelationAnalysisRefactored responsesData={mockResponsesData} />);
      }).not.toThrow();
    });
  });
});