import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="page-shell about-hero-inner">
          <span className="eyebrow">SOBRE O OPORTUNIZA</span>
          <h1>Mais clareza para encontrar seu próximo caminho.</h1>
          <p>
            Oportuniza reúne vagas de emprego e cursos de capacitação em um só lugar,
            ajudando você a explorar possibilidades para sua trajetória profissional.
          </p>
          <div className="about-actions">
            <Link className="button button-primary" to="/">Explorar vagas <span aria-hidden="true">→</span></Link>
            <Link className="button button-secondary" to="/cursos">Conhecer cursos</Link>
          </div>
        </div>
      </section>

      <section className="page-shell about-content">
        <article className="about-panel">
          <span className="about-icon" aria-hidden="true">✳</span>
          <span className="eyebrow">NOSSA PROPOSTA</span>
          <h2>O que é a plataforma?</h2>
          <p>
            O Oportuniza é uma plataforma de consulta a oportunidades profissionais e
            capacitação. Pessoas visitantes podem pesquisar vagas publicadas e conhecer
            cursos. A equipe administradora pode manter os anúncios de vagas e os cursos
            organizados e atualizados.
          </p>
        </article>
        <article className="about-panel">
          <span className="about-icon" aria-hidden="true">◎</span>
          <span className="eyebrow">PARA QUEM</span>
          <h2>Um espaço para novos passos</h2>
          <p>
            O público a que a plataforma se destina são pessoas maiores de 18 anos que
            buscam oportunidades de trabalho ou aprendizagem. O site não verifica a idade
            de quem o acessa.
          </p>
        </article>
        <article className="about-panel about-panel-highlight">
          <span className="about-icon" aria-hidden="true">8</span>
          <span className="eyebrow">NOSSO ALINHAMENTO</span>
          <h2>ODS 8 — Trabalho Decente e Crescimento Econômico</h2>
          <p>
            O projeto se inspira no ODS 8 ao facilitar a consulta a oportunidades de
            trabalho e qualificação. Essa contribuição é um objetivo da iniciativa, não
            uma promessa de emprego nem um impacto já medido.
          </p>
        </article>
      </section>

      <section className="page-shell about-transparency">
        <span className="eyebrow">INFORMAÇÃO IMPORTANTE</span>
        <h2>Confira cada oportunidade na fonte.</h2>
        <p>
          Alguns registros foram incluídos no banco para demonstrar o funcionamento do
          projeto. Eles não representam vagas confirmadas ou cursos cuja disponibilidade
          tenha sido verificada. Antes de se candidatar ou se inscrever, confira os
          detalhes diretamente com a empresa ou instituição indicada. Links em
          <code> example.org</code> são exemplos e não recebem candidaturas.
        </p>
      </section>
    </main>
  );
}
