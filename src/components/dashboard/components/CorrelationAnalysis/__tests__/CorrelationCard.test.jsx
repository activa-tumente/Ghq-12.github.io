/**
 * Tests unitarios para CorrelationCard component
 * 
 * @author Sistema de Evaluación Psicológica BAT-7
 * @version 2.0.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CorrelationCard from '../CorrelationCard';

// Mock data para las pruebas
const mockCorrelationData = {
  variable1: 'Puntaje BAT-7',
  variable2: 'Nivel de Confianza',
  value: 0.75,
  strength: 'Fuerte',
  direction: 'Positiva',
  description: 'Correlación fuerte positiva entre puntaje BAT-7 y nivel de confianza'
};

const mockWeakCorrelation = {
  variable1: 'Edad',
  variable2: 'Satisfacción',
  value: 0.15,
  strength: 'Débil',
  direction: 'Positiva',
  description: 'Correlación débil positiva entre edad y satisfacción'
};

const mockNegativeCorrelation = {
  variable1: 'Accidentes Previos',
  variable2: 'Confianza',
  value: -0.65,
  strength: 'Moderada',
  direction: 'Negativa',
  description: 'Correlación moderada negativa entre accidentes previos y confianza'
};

const mockInvalidCorrelation = {
  variable1: 'Variable A',
  variable2: 'Variable B',
  value: null,
  strength: 'Sin datos',
  direction: 'N/A',
  description: 'Sin datos suficientes para calcular correlación'
};

describe('CorrelationCard Component', () => {
  describe('Renderizado básico', () => {
    it('debería renderizar correctamente con datos válidos', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      expect(screen.getByText('Puntaje BAT-7')).toBeInTheDocument();
      expect(screen.getByText('Nivel de Confianza')).toBeInTheDocument();
      expect(screen.getByText('0.750')).toBeInTheDocument();
      expect(screen.getByText('Fuerte')).toBeInTheDocument();
      expect(screen.getByText(/Correlación fuerte positiva/)).toBeInTheDocument();
    });

    it('debería renderizar el separador "vs" entre variables', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    it('debería mostrar el icono de dirección correcto', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      // Buscar el icono de correlación positiva
      expect(screen.getByText('↗️')).toBeInTheDocument();
    });
  });

  describe('Estados de correlación', () => {
    it('debería mostrar correlación fuerte con estilos correctos', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const strengthBadge = screen.getByText('Fuerte');
      expect(strengthBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('debería mostrar correlación débil con estilos correctos', () => {
      render(<CorrelationCard correlation={mockWeakCorrelation} />);
      
      const strengthBadge = screen.getByText('Débil');
      expect(strengthBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('debería mostrar correlación negativa con icono correcto', () => {
      render(<CorrelationCard correlation={mockNegativeCorrelation} />);
      
      expect(screen.getByText('↘️')).toBeInTheDocument();
      expect(screen.getByText('-0.650')).toBeInTheDocument();
    });

    it('debería manejar datos inválidos correctamente', () => {
      render(<CorrelationCard correlation={mockInvalidCorrelation} />);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.getByText('Sin datos')).toBeInTheDocument();
      expect(screen.getByText('❓')).toBeInTheDocument();
    });
  });

  describe('Barra de progreso', () => {
    it('debería mostrar barra de progreso para correlación fuerte', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('debería calcular el ancho de la barra correctamente', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '75%' });
    });

    it('debería manejar valores negativos en la barra de progreso', () => {
      render(<CorrelationCard correlation={mockNegativeCorrelation} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '65'); // valor absoluto
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener etiquetas ARIA apropiadas', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Correlación entre Puntaje BAT-7 y Nivel de Confianza');
    });

    it('debería tener descripción accesible para la barra de progreso', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Fuerza de correlación: 75%');
    });

    it('debería tener texto alternativo para iconos', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const directionIcon = screen.getByLabelText('Correlación positiva');
      expect(directionIcon).toBeInTheDocument();
    });

    it('debería ser navegable por teclado', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Interactividad', () => {
    it('debería manejar eventos de teclado', () => {
      const onFocus = vi.fn();
      render(
        <div onFocus={onFocus}>
          <CorrelationCard correlation={mockCorrelationData} />
        </div>
      );
      
      const card = screen.getByRole('article');
      fireEvent.focus(card);
      
      expect(onFocus).toHaveBeenCalled();
    });

    it('debería tener efectos hover apropiados', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('hover:shadow-md');
    });
  });

  describe('Responsive design', () => {
    it('debería tener clases responsive apropiadas', () => {
      render(<CorrelationCard correlation={mockCorrelationData} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveClass('p-4');
      
      // Verificar que tiene clases de grid responsive
      const content = card.querySelector('.space-y-3');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Formateo de datos', () => {
    it('debería formatear valores decimales correctamente', () => {
      const correlationWithPrecision = {
        ...mockCorrelationData,
        value: 0.123456789
      };
      
      render(<CorrelationCard correlation={correlationWithPrecision} />);
      
      expect(screen.getByText('0.123')).toBeInTheDocument();
    });

    it('debería manejar valores de cero', () => {
      const zeroCorrelation = {
        ...mockCorrelationData,
        value: 0,
        strength: 'Muy Débil',
        direction: 'Neutral'
      };
      
      render(<CorrelationCard correlation={zeroCorrelation} />);
      
      expect(screen.getByText('0.000')).toBeInTheDocument();
      expect(screen.getByText('➡️')).toBeInTheDocument();
    });

    it('debería manejar valores muy pequeños', () => {
      const tinyCorrelation = {
        ...mockCorrelationData,
        value: 0.001,
        strength: 'Muy Débil'
      };
      
      render(<CorrelationCard correlation={tinyCorrelation} />);
      
      expect(screen.getByText('0.001')).toBeInTheDocument();
    });
  });

  describe('Casos edge', () => {
    it('debería manejar nombres de variables muy largos', () => {
      const longNameCorrelation = {
        ...mockCorrelationData,
        variable1: 'Variable con un nombre extremadamente largo que podría causar problemas de layout',
        variable2: 'Otra variable con nombre muy largo'
      };
      
      render(<CorrelationCard correlation={longNameCorrelation} />);
      
      expect(screen.getByText(/Variable con un nombre extremadamente largo/)).toBeInTheDocument();
    });

    it('debería manejar descripciones vacías', () => {
      const emptyDescriptionCorrelation = {
        ...mockCorrelationData,
        description: ''
      };
      
      render(<CorrelationCard correlation={emptyDescriptionCorrelation} />);
      
      // Debería renderizar sin errores
      expect(screen.getByText('Puntaje BAT-7')).toBeInTheDocument();
    });

    it('debería manejar propiedades faltantes gracefully', () => {
      const incompleteCorrelation = {
        variable1: 'Variable A',
        variable2: 'Variable B'
        // Faltan otras propiedades
      };
      
      render(<CorrelationCard correlation={incompleteCorrelation} />);
      
      expect(screen.getByText('Variable A')).toBeInTheDocument();
      expect(screen.getByText('Variable B')).toBeInTheDocument();
    });
  });
});