# Navegação

O menu principal contém Projects / Projetos, Writing / Artigos, About / Sobre e Contact / Contato. Writing só aparece quando houver artigos publicados no idioma atual. Projects, Writing e Contact rolam para as seções na home e abrem as páginas equivalentes nas outras rotas. About sempre abre `/about/` ou `/pt/about/`, reunindo a apresentação, experiência, formação e certificações. As URLs existentes de artigos continuam sob `/blog/` e `/pt/blog/`.

Projetos, Formação e cursos, Sobre e Contato têm páginas em `/projects/`, `/courses/`, `/about/` e `/contact/`, com equivalentes sob `/pt/`. Os estudos de caso retornam à galeria de projetos. A troca de idioma preserva a página equivalente.

A navegação para Projetos considera a posição final da seção após o hero sticky. A rolagem é suave, exceto com movimento reduzido ativado.

A home mostra no máximo quatro projetos, seguindo o campo `order` dos estudos de caso: os dois primeiros ficam na composição do hero e os próximos dois aparecem na sequência. “Ver todos os projetos” abre a galeria completa, que também inclui repositórios sincronizados aprovados sem estudo de caso. Writing mostra os três artigos mais recentes na home e todos na listagem. Formação e certificações ficam dentro de About. As páginas legadas `/courses/` e `/certifications/` (esta somente quando houver conteúdo publicado), suas traduções e as âncoras `#courses`, `#certifications` e `#about` permanecem disponíveis.

Links externos e documentos PDF abrem em nova aba, preservando a aba do portfólio. Isso inclui GitHub, LinkedIn, credenciais, certificados e fontes escritas em Markdown. Os currículos são abertos no leitor de PDF do navegador, que permite baixá-los. A navegação interna, as âncoras, a troca de idioma e o retorno aos projetos continuam na mesma aba com ClientRouter. As formações mantêm resumos de um parágrafo na home e descrições completas no Sobre.
