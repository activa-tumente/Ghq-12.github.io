import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskHeatmap from '../RiskHeatmap';

/**
 * Tests unitarios para RiskHeatmap
 * Verifica funcionalidad, edge cases y performance
 */

// Mock data para testing
const mockDashboardData = {
  responses: [
    {
      usuarios: { departamento: 'Producción' },
      puntaje_normalizado: 2.5
    },
    {
      usuarios: { departamento: 'Producción' },
      puntaje_normalizado: 2.0
    },
    {
      usuarios: { departamento: 'Administración' },
      puntaje_normalizado: 1.5
    },
    {
      usuarios: { departamento: 'Mantenimiento' },
      puntaje_normalizado: 3.0
    }
  ]
};

const mockEmptyData = {
  responses: []
};

describe('RiskHeatmap', () => {
  it('muestra estado de carga correctamente', () => {
    render(<RiskHeatmap data={null} loading={true} />);
    
    expect(screen.getByText('Cargando mapa de riesgo...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay datos', () => {
    render(<RiskHeatmap data={mockEmptyData} loading={false} />);
    
    expect(screen.getByText('No hay datos suficientes para generar el mapa de riesgo')).toBeInTheDocument();
  });

  it('renderiza correctamente con datos válidos', () => {
    render(<RiskHeatmap data={mockDashboardData} loading={false} />);
    
    // Verificar que se muestra el título
    expect(screen.getByText('Mapa de Riesgo por Departamento')).toBeInTheDocument();
    
    // Verificar que se muestran los departamentos
    expect(screen.getByText('Producción')).toBeInTheDocument();
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
  });

  it('calcula correctamente los niveles de riesgo', () => {
    render(<RiskHeatmap data={mockDashboardData} loading={false} />);
    
    // Producción: (2.5 + 2.0) / 2 = 2.25 -> (2.25/3)*100 = 75% (Alto)
    // Administración: 1.5 -> (1.5/3)*100 = 50% (Medio)
    // Mantenimiento: 3.0 -> (3.0/3)*100 = 100% (Crítico)
    
    const productionElement = screen.getByText('Producción').closest('[data-testid="department-card"]');
    const administrationElement = screen.getByText('Administración').closest('[data-testid="department-card"]');
    const maintenanceElement = screen.getByText('Mantenimiento').closest('[data-testid="department-card"]');
    
    // Verificar clases CSS para niveles de riesgo
    expect(productionElement).toHaveClass('bg-orange-500'); // Alto riesgo
    expect(administrationElement).toHaveClass('bg-yellow-400'); // Medio riesgo
    expect(maintenanceElement).toHaveClass('bg-red-600'); // Crítico
  });

  it('identifica correctamente departamentos críticos', () => {
    render(<RiskHeatmap data={mockDashboardData} loading={false} />);
    
    // Mantenimiento debería aparecer en la sección de departamentos críticos (100% riesgo)
    expect(screen.getByText('Departamentos de Mayor Riesgo')).toBeInTheDocument();
    
    const criticalSection = screen.getByTestId('critical-departments');
    expect(criticalSection).toHaveTextContent('Mantenimiento');
  });

  it('muestra estadísticas correctas', () => {
    render(<RiskHeatmap data={mockDashboardData} loading={false} />);
    
    // Verificar que se muestran las estadísticas
    expect(screen.getByText('Estadísticas Generales')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Total departamentos
    expect(screen.getByText('4')).toBeInTheDocument(); // Total evaluaciones
  });

  it('maneja datos con estructura alternativa', () => {
    const alternativeData = {
      data: {
        responses: mockDashboardData.responses
      }
    };
    
    render(<RiskHeatmap data={alternativeData} loading={false} />);
    
    expect(screen.getByText('Mapa de Riesgo por Departamento')).toBeInTheDocument();
    expect(screen.getByText('Producción')).toBeInTheDocument();
  });

  it('maneja datos con valores nulos o indefinidos', () => {
    const dataWithNulls = {
      responses: [
        {
          usuarios: { departamento: 'Test' },
          puntaje_normalizado: null
        },
        {
          usuarios: { departamento: null },
          puntaje_normalizado: 2.0
        },
        {
          usuarios: { departamento: 'Valid' },
          puntaje_normalizado: 1.5
        }
      ]
    };
    
    render(<RiskHeatmap data={dataWithNulls} loading={false} />);
    
    // Solo debería mostrar el departamento válido
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('no re-renderiza innecesariamente con los mismos datos', () => {
    const renderSpy = vi.fn();
    const TestComponent = vi.fn(() => {
      renderSpy();
      return <RiskHeatmap data={mockDashboardData} loading={false} />;
    });
    
    const { rerender } = render(<TestComponent />);
    
    // Primera renderización
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    // Re-renderizar con los mismos props
    rerender(<TestComponent />);
    
    // No debería re-renderizar debido a React.memo
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });

  it('muestra acciones recomendadas para departamentos críticos', () => {
    render(<RiskHeatmap data={mockDashboardData} loading={false} />);
    
    expect(screen.getByText('Acciones Recomendadas')).toBeInTheDocument();
    expect(screen.getByText(/Implementar capacitación urgente/)).toBeInTheDocument();
    expect(screen.getByText(/Revisar procedimientos de seguridad/)).toBeInTheDocument();
  });
});