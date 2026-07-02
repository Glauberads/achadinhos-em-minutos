const fs = require('fs');
let code = fs.readFileSync('apps/web/src/pages/CreativeStudio.tsx', 'utf-8');

// Fix 1: Add Scroll
code = code.replace(
  '<div className="space-y-6">',
  '<div className="space-y-6 h-full overflow-y-auto pr-2 pb-20 custom-scrollbar" style={{ maxHeight: \'calc(100vh - 100px)\' }}>'
);

// Fix 2: Wrap previewRef correctly to fix html-to-image scale bug
const oldLayout = `                      <div 
                        style={{
                          width: generatedImageCreative.metadata?.image_format === 'story' ? 1080 * 0.35 : 1080 * 0.35,
                          height: generatedImageCreative.metadata?.image_format === 'story' ? 1920 * 0.35 : 1080 * 0.35,
                        }}
                        className="relative overflow-hidden shadow-lg rounded-md"
                      >
                        {/* A div que será exportada */}
                        <div 
                          ref={previewRef}
                          style={{
                            width: '1080px',
                            height: generatedImageCreative.metadata?.image_format === 'story' ? '1920px' : '1080px',
                            transform: 'scale(0.35)',
                            transformOrigin: 'top left',
                          }}
                          className="absolute top-0 left-0 bg-white"
                        >
                          {/* Imagem de Fundo (Produto) */}
                        <img 
                          src={generatedImageCreative.metadata?.design_payload?.image_url} 
                          alt="Produto"`;

const newLayout = `                      <div 
                        style={{
                          width: generatedImageCreative.metadata?.image_format === 'story' ? 1080 * 0.25 : 1080 * 0.25,
                          height: generatedImageCreative.metadata?.image_format === 'story' ? 1920 * 0.25 : 1080 * 0.25,
                        }}
                        className="relative overflow-hidden shadow-lg rounded-md"
                      >
                        {/* Wrapper de Escala Visual */}
                        <div style={{ transform: 'scale(0.25)', transformOrigin: 'top left' }}>
                          {/* A div que será exportada */}
                          <div 
                            ref={previewRef}
                            style={{
                              width: '1080px',
                              height: generatedImageCreative.metadata?.image_format === 'story' ? '1920px' : '1080px',
                            }}
                            className="relative bg-white overflow-hidden"
                          >
                            {/* Imagem de Fundo (Produto) usando proxy! */}
                          <img 
                          src={\`http://localhost:3001/api/creatives/proxy-image?url=\${encodeURIComponent(generatedImageCreative.metadata?.design_payload?.image_url)}\`}
                          alt="Produto"`;
                          
code = code.replace(oldLayout, newLayout);

// Fix 4: Add missing closing div that was causing JSX error
code = code.replace(
`                           <p className="text-2xl font-medium opacity-80 uppercase tracking-widest">Achei na {generatedImageCreative.marketplace}</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'galeria' && (`,
`                           <p className="text-2xl font-medium opacity-80 uppercase tracking-widest">Achei na {generatedImageCreative.marketplace}</p>
                        </div>
                      </div>
                    </div>
                 </div>
               </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'galeria' && (`
);

fs.writeFileSync('apps/web/src/pages/CreativeStudio.tsx', code);
console.log('Script executed.');
