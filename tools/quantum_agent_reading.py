"""Readable HTML and Markdown for the Quantum agent architecture and participation guide."""
from html import escape
import json

def render(a):
    h=['<section class="quantum-agent-guide"><style>.quantum-agent-guide pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%;padding:16px;border:1px solid #34414a;font-size:13px}.quantum-agent-guide .agent-nav{display:flex;gap:12px 20px;flex-wrap:wrap}.quantum-agent-guide blockquote{border-left:2px solid #89cfdf;padding-left:18px;margin-left:0}</style>'];m=[]
    e=lambda v:escape(str(v))
    def heading(level,title,id=None):h.append(f'<h{level}'+(f' id="{id}"'if id else '')+'>'+e(title)+f'</h{level}>');m.append('#'*level+' '+title)
    def p(text):h.append('<p>'+e(text)+'</p>');m.append(text)
    def link(url,label):h.append('<p><a href="'+e(url)+'">'+e(label)+'</a></p>');m.append('['+label+']('+url+')')
    def bullets(items,ordered=False):
        tag='ol'if ordered else 'ul';h.append('<'+tag+'>'+''.join('<li>'+e(x)+'</li>'for x in items)+'</'+tag+'>');m.append('\n'.join((str(i+1)+'. 'if ordered else '- ')+x for i,x in enumerate(items)))
    def code(value):
        text=value if isinstance(value,str)else json.dumps(value,ensure_ascii=False,indent=2);h.append('<pre><code>'+e(text)+'</code></pre>');m.append('```'+('text'if isinstance(value,str)else 'json')+'\n'+text+'\n```')
    def table(caption,cols,rows):
        h.append('<div class="table-wrap"><table><caption>'+e(caption)+'</caption><thead><tr>'+''.join('<th scope="col">'+e(x)+'</th>'for x in cols)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+e(x)+'</td>'for x in row)+'</tr>'for row in rows)+'</tbody></table></div>')
        safe=lambda x:str(x).replace('|','\\|').replace('\n',' ')
        m.append('**'+caption+'**\n\n'+'| '+' | '.join(map(safe,cols))+' |\n| '+' | '.join('---'for _ in cols)+' |\n'+'\n'.join('| '+' | '.join(map(safe,row))+' |'for row in rows))
    h.append('<nav class="agent-nav" aria-label="Quantum Wiki sections"><a href="#quantum-purpose">Purpose</a><a href="#quantum-features">Features</a><a href="#quantum-agent-roles">Agent roles</a><a href="#quantum-agent-workflow">Workflow</a><a href="#quantum-participation">AI participation</a><a href="#quantum-mcp">MCP</a><a href="#quantum-a2a">A2A</a><a href="#quantum-recorded-study">Recorded study</a></nav>')
    purpose=a['purpose'];heading(2,purpose['title'],'quantum-purpose');p(purpose['summary']);p(purpose['why'])
    heading(3,'Explain this to a person');p(purpose['human_explanation']);heading(3,'Guidance for an AI explaining the page');bullets(purpose['instructions_for_ai']);heading(3,'Questions a person can ask');bullets(purpose['example_questions'])
    heading(2,'What each feature helps a person do','quantum-features');table('Quantum Atlas feature guide',['Feature','Purpose','Value for the person'],[[f['feature'],f['purpose'],f['human_value']]for f in a['features']])
    s=a['swarm'];heading(2,s['title'],'quantum-agent-roles');p(s['summary']);table('Scientific roles and handoffs',['Agent or service','Role','Work','Handoff'],[[r['name'],r['role'],r['work'],r['handoff']]for r in s['roles']])
    heading(2,'How the investigation moves through the system','quantum-agent-workflow');table('Interactive workflow diagram: exact explanations from the Quantum page',['Stage','Heading','Explanation'],[[k,*v]for k,v in s['diagram_stages'].items()]);bullets([x['title']+': '+x['action']for x in s['current_workflow']],True)
    heading(3,'Reviews, interruptions and recovery');p(s['recovery']);heading(3,'Current execution and recorded measurements');p(s['execution_scope']);heading(3,'Research memory and provenance');p(s['memory']);p(s['record']);heading(3,'The wider collaboration architecture');p(s['extensions'])
    x=a['participation'];heading(2,x['title'],'quantum-participation');p(x['intro']);table('Choose the participation route',['Route','Purpose','Entry point','Access'],[[r['route'],r['purpose'],r['entry'],r['authentication']]for r in x['routes']]);link(x['connect_guide'],'Connection setup guides and client examples')
    heading(2,'Connect research tools through MCP','quantum-mcp');p('MCP lets an external AI request structured research records as tools inside its own conversation.');link(x['mcp']['endpoint'],'Public MCP endpoint');p(x['mcp']['transport']);code(x['mcp']['headers']);bullets(x['mcp']['workflow'],True)
    table('Discoverable MCP tools',['Tool','Purpose'],[[t['name'],t['description']]for t in x['mcp']['tools']]);heading(3,'Connection and study-reading requests')
    for request in x['mcp']['requests']:code(request)
    p(x['mcp']['result']);p(x['mcp']['continuation']);heading(3,'REST API alternatives')
    for label,url in x['api'].items():link(url,label.replace('_',' ').capitalize())
    heading(2,'Ask Universal One through A2A','quantum-a2a');p('A2A lets one agent send a research question to Universal One and receive its answer with source references.');link(x['a2a']['agent_card'],'Discover the public agent card');link(x['a2a']['endpoint'],'A2A JSON-RPC endpoint');code(x['a2a']['headers']);code(x['a2a']['request']);p(x['a2a']['response']);p(x['a2a']['scope'])
    heading(3,'From an AI conversation to a new investigation');p(x['handoff']);p(x['citation_contract']);h.append('</section>')
    return '\n'.join(h),'\n\n'.join(m)+'\n'
