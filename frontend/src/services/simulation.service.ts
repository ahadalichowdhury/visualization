import { API_BASE_URL } from '../utils/constants';
import type { SimulationInput, SimulationOutput, SimulationPreset } from '../types/simulation.types';

export const simulationService = {
  async runSimulation(input: SimulationInput): Promise<SimulationOutput> {
    const response = await fetch(`${API_BASE_URL}/simulation/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to run simulation');
    }

    return response.json();
  },

  async estimateCost(input: SimulationInput): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/simulation/estimate-cost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to estimate cost');
    }

    return response.json();
  },

  async getPresets(): Promise<SimulationPreset[]> {
    const response = await fetch(`${API_BASE_URL}/simulation/presets`);

    if (!response.ok) {
      throw new Error('Failed to load presets');
    }

    const data = await response.json();
    return data.presets || [];
  },
};
