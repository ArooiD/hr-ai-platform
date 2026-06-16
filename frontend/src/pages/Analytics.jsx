import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BriefcaseBusiness, CalendarCheck2, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { dashboardApi } from '../api/client';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardApi.getDashboard();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Загрузка аналитики...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <BarChart3 size={48} />
          <p>Не удалось загрузить данные аналитики</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Открытые вакансии', value: data.open_vacancies, icon: BriefcaseBusiness, color: '#0b73ff' },
    { label: 'Закрытые вакансии', value: data.closed_vacancies, icon: CalendarCheck2, color: '#9aa0a8' },
    { label: 'Кандидатов всего', value: data.candidates, icon: Users, color: '#34c759' },
    { label: 'Откликов', value: data.applications, icon: Award, color: '#a855f7' },
  ];

  const stages = [
    { label: 'Новые', value: data.applications_by_stage?.new || 0, color: '#0b73ff' },
    { label: 'Скрининг', value: data.applications_by_stage?.screening || 0, color: '#ff9f0a' },
    { label: 'Интервью', value: data.applications_by_stage?.interview || 0, color: '#a855f7' },
    { label: 'Оффер', value: data.applications_by_stage?.offer || 0, color: '#34c759' },
    { label: 'Наняты', value: data.applications_by_stage?.hired || 0, color: '#166534' },
    { label: 'Отклонены', value: data.applications_by_stage?.rejected || 0, color: '#dc2626' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><BarChart3 size={32} /> Аналитика</h1>
          <p>Обзор процесса подбора персонала</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="card-header" style={{ marginBottom: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: `${stat.color}20`,
                display: 'grid',
                placeItems: 'center',
                color: stat.color
              }}>
                <stat.icon size={24} />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#111318' }}>{stat.value}</div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* AI Score */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3><TrendingUp size={20} style={{ color: '#34c759', marginRight: '8px' }} /> Средний AI score</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#34c759' }}>{data.avg_ai_score}%</div>
            <div style={{ color: '#6b7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#166534' }}>
                <ArrowUpRight size={16} /> Высокое качество кандидатов
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>На основе AI-анализа откликов</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><Award size={20} style={{ color: '#a855f7', marginRight: '8px' }} /> Конверсия</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#a855f7' }}>
              {data.applications > 0 ? Math.round((data.applications_by_stage?.hired || 0) / data.applications * 100) : 0}%
            </div>
            <div style={{ color: '#6b7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#166534' }}>
                <ArrowUpRight size={16} /> Кандидат → Нанят
              </div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Эффективность процесса подбора</div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications by Stage */}
      <div className="card">
        <div className="card-header">
          <h3><CalendarCheck2 size={20} style={{ color: '#0b73ff', marginRight: '8px' }} /> Распределение откликов по этапам</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '20px' }}>
          {stages.map((stage) => (
            <div key={stage.label} style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              background: `${stage.color}15`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: stage.color }}>{stage.value}</div>
              <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{stage.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6' }}>
            {stages.map((stage) => {
              const total = stages.reduce((sum, s) => sum + s.value, 0);
              const percentage = total > 0 ? (stage.value / total * 100) : 0;
              return (
                <div 
                  key={stage.label}
                  style={{ 
                    width: `${percentage}%`, 
                    background: stage.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#fff',
                    fontWeight: '700'
                  }}
                  title={`${stage.label}: ${stage.value}`}
                >
                  {percentage > 10 ? `${Math.round(percentage)}%` : ''}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            {stages.map((stage) => (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: stage.color }} />
                {stage.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
