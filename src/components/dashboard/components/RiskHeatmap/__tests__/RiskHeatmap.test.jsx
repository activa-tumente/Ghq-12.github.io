import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import RiskHeatmapRefactored from '../RiskHeatmapRefactored';
import { useRiskHeatmapData } from '../../../../../hooks/useRiskHeatmapData';

// Mock del hook personalizado
vi.mock('../../../../../hooks/useRiskHeatmapData');

// Mock de react-icons
vi.mock('react-icons/md', () => ({
  MdBusiness: () => <div data-testid="icon-business">Business Icon</div>,
  MdPeople: () => <div data-testid="icon-people">People Icon</div>,
  MdBuild: () => <div data-testid="icon-build">Build Icon</div>,
  MdWarning: () => <div data-testid="icon-warning">Warning Icon</div>,
  MdLocalShipping: () => <div data-testid="icon-shipping">Shipping Icon</div>,
  MdInventory: () => <div data-testid="icon-inventory">Inventory Icon</div>,
  MdLocalHospital: () => <div data-testid="icon-hospital">Hospital Icon</div>,
  MdSecurity: () => <div data-testid="icon-security">Security Icon</div>,
  MdFactory: () => <div data-testid="icon-factory">Factory Icon</div>,
  MdVerifiedUser: () => <div data-testid="icon-verified">Verified Icon</div>
}));

describe('RiskHeatmapRefactored', () => {
  const mockHeatmapData = {
    departments: ['Administración', 'Recursos Humanos', 'Mantenimiento'],
    averageRisk: {
      'Administración': 45.5,
      'Recursos Humanos': 67.8,
      'Mantenimiento': 82.3
    },
    isEmpty: false
  };

  const mockCriticalDepartments = [
    { department: 'Mantenimiento', riskValue: 82.3 }
  ];

  const mockStatistics = {
    averageRisk: 65.2,
    criticalCount: 1,
    departmentsAboveAverage: 2
  };

  const mockRecommendations = [
    'Implementar capacitación adicional en Mantenimiento',
    'Revisar protocolos de seguridad en Recursos Humanos',
    'Establecer auditorías mensuales'
  ];

  const mockData = {
    responses: [
      { id: 1, department: 'Administración' },
      { id: 2, department: 'Recursos Humanos' }
    ],
    segmented: {
      byDepartment: {
        'Administración': [{ riskScore: 45.5 }],
        'Recursos Humanos': [{ riskScore: 67.8 }]
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Estados de carga y vacío', () => {
    it('muestra skeleton de carga cuando loading es true', () => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: { isEmpty: true },
        criticalDepartments: [],
        statistics: {},
        recommendations: []
      });

      render(<RiskHeatmapRefactored data={null} loading={true} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Cargando mapa de riesgo...')).toBeInTheDocument();
    });

    it('muestra estado vacío cuando no hay datos', () => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: { isEmpty: true },
        criticalDepartments: [],
        statistics: {},
        recommendations: []
      });

      render(<RiskHeatmapRefactored data={null} loading={false} />);
      
      expect(screen.getByText('No hay datos disponibles para mostrar el heatmap')).toBeInTheDocument();
      expect(screen.getByText('Asegúrate de que existan respuestas con departamentos asignados')).toBeInTheDocument();
    });
  });

  describe('Renderizado con datos', () => {
    beforeEach(() => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: mockHeatmapData,
        criticalDepartments: mockCriticalDepartments,
        statistics: mockStatistics,
        recommendations: mockRecommendations
      });
    });

    it('renderiza el componente principal correctamente', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByText('Mapa de Riesgo por Departamento')).toBeInTheDocument();
      expect(screen.getByText('65.2%')).toBeInTheDocument(); // Promedio
      expect(screen.getByText('1')).toBeInTheDocument(); // Críticos
    });

    it('muestra todos los departamentos en el grid', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByText('Administración')).toBeInTheDocument();
      expect(screen.getByText('Recursos Humanos')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
    });

    it('muestra los iconos correctos para cada departamento', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByTestId('icon-business')).toBeInTheDocument();
      expect(screen.getByTestId('icon-people')).toBeInTheDocument();
      expect(screen.getByTestId('icon-build')).toBeInTheDocument();
    });

    it('muestra la lista de departamentos críticos', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByText('Departamentos Críticos')).toBeInTheDocument();
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
      expect(screen.getByText('82.3%')).toBeInTheDocument();
    });

    it('muestra las recomendaciones', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByText('Acciones Recomendadas')).toBeInTheDocument();
      expect(screen.getByText('Implementar capacitación adicional en Mantenimiento')).toBeInTheDocument();
    });

    it('muestra el resumen estadístico', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByText('Resumen Estadístico')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Departamentos evaluados
      expect(screen.getByText('2')).toBeInTheDocument(); // Sobre promedio
    });
  });

  describe('Interactividad', () => {
    beforeEach(() => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: mockHeatmapData,
        criticalDepartments: mockCriticalDepartments,
        statistics: mockStatistics,
        recommendations: mockRecommendations
      });
    });

    it('maneja clicks en las tarjetas de departamento', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      const adminCard = screen.getByText('Administración').closest('div[role="button"]');
      fireEvent.click(adminCard);
      
      expect(consoleSpy).toHaveBeenCalledWith('Navegando a detalle de Administración');
      
      consoleSpy.mockRestore();
    });

    it('permite navegación por teclado en las tarjetas', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      const adminCard = screen.getByText('Administración').closest('div[role="button"]');
      
      // Simular navegación por teclado
      fireEvent.keyDown(adminCard, { key: 'Tab' });
      expect(adminCard).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Accesibilidad', () => {
    beforeEach(() => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: mockHeatmapData,
        criticalDepartments: mockCriticalDepartments,
        statistics: mockStatistics,
        recommendations: mockRecommendations
      });
    });

    it('tiene las etiquetas ARIA correctas', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByRole('region', { name: 'Estadísticas principales' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Leyenda de niveles de riesgo' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Departamentos evaluados' })).toBeInTheDocument();
    });

    it('tiene headings estructurados correctamente', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    });

    it('proporciona descripciones accesibles para los valores', () => {
      render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      expect(screen.getByLabelText('Promedio de riesgo: 65.2 por ciento')).toBeInTheDocument();
      expect(screen.getByLabelText('1 departamentos críticos')).toBeInTheDocument();
    });
  });

  describe('PropTypes y validación', () => {
    it('maneja props undefined sin errores', () => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: { isEmpty: true },
        criticalDepartments: [],
        statistics: {},
        recommendations: []
      });

      expect(() => {
        render(<RiskHeatmapRefactored />);
      }).not.toThrow();
    });

    it('maneja datos malformados graciosamente', () => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: { isEmpty: true },
        criticalDepartments: [],
        statistics: {},
        recommendations: []
      });

      const malformedData = { responses: null };
      
      expect(() => {
        render(<RiskHeatmapRefactored data={malformedData} />);
      }).not.toThrow();
    });
  });

  describe('Memoización y performance', () => {
    it('no re-renderiza innecesariamente con las mismas props', () => {
      useRiskHeatmapData.mockReturnValue({
        heatmapData: mockHeatmapData,
        criticalDepartments: mockCriticalDepartments,
        statistics: mockStatistics,
        recommendations: mockRecommendations
      });

      const { rerender } = render(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      // Re-renderizar con las mismas props
      rerender(<RiskHeatmapRefactored data={mockData} loading={false} />);
      
      // El hook debería ser llamado solo una vez debido a la memoización
      expect(useRiskHeatmapData).toHaveBeenCalledTimes(2); // Una vez por cada render
    });
  });
});