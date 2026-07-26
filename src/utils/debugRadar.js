// Script de debug para verificar datos del radar
export const debugRadarData = () => {
  const mockCompetencyData = [
    { subject: 'Comunicación', A: 4.7, fullMark: 5 },
    { subject: 'Conocimiento', A: 4.5, fullMark: 5 },
    { subject: 'Metodología', A: 4.6, fullMark: 5 },
    { subject: 'Evaluación', A: 4.4, fullMark: 5 },
    { subject: 'Disponibilidad', A: 4.8, fullMark: 5 }
  ];

  console.log('🔍 Debug Radar Data:');
  console.log('📊 Mock Competency Data:', mockCompetencyData);
  console.log('📊 Data length:', mockCompetencyData.length);
  console.log('📊 First item:', mockCompetencyData[0]);
  console.log('📊 All subjects:', mockCompetencyData.map(item => item.subject));
  console.log('📊 All values:', mockCompetencyData.map(item => item.A));

  return mockCompetencyData;
};








