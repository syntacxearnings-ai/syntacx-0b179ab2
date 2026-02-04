import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useListingGenerator, GeneratedListing } from '@/hooks/useListingGenerator';
import { useToast } from '@/hooks/use-toast';

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copiado!', description: label || 'Texto copiado para a área de transferência.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6">
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function SectionCard({ title, children, copyText }: { title: string; children: React.ReactNode; copyText?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{title}</h4>
        {copyText && <CopyButton text={copyText} label={title} />}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function GeneratedContent({ listing }: { listing: GeneratedListing }) {
  return (
    <Tabs defaultValue="titulo" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="titulo">Título</TabsTrigger>
        <TabsTrigger value="descricao">Descrição</TabsTrigger>
        <TabsTrigger value="extras">Extras</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>

      <ScrollArea className="h-[400px] mt-4">
        <TabsContent value="titulo" className="space-y-4 m-0">
          <SectionCard title="📌 Título SEO (max 60 chars)" copyText={listing.titulo}>
            <p className="font-medium text-foreground">{listing.titulo}</p>
            <p className="text-xs mt-1">({listing.titulo.length} caracteres)</p>
          </SectionCard>

          <SectionCard title="🖼️ Texto para Imagem Principal" copyText={listing.texto_imagem}>
            <p className="font-bold text-lg text-foreground">{listing.texto_imagem}</p>
          </SectionCard>

          <SectionCard title="🏷️ SKU Sugerido" copyText={listing.sku}>
            <code className="bg-muted px-2 py-1 rounded text-foreground">{listing.sku}</code>
          </SectionCard>
        </TabsContent>

        <TabsContent value="descricao" className="space-y-4 m-0">
          <SectionCard title="🎯 Método AIDA" copyText={`${listing.descricao_aida.atencao}\n\n${listing.descricao_aida.interesse}\n\n${listing.descricao_aida.desejo}\n\n${listing.descricao_aida.acao}`}>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-foreground">Atenção:</span>
                <p>{listing.descricao_aida.atencao}</p>
              </div>
              <div>
                <span className="font-semibold text-foreground">Interesse:</span>
                <p>{listing.descricao_aida.interesse}</p>
              </div>
              <div>
                <span className="font-semibold text-foreground">Desejo:</span>
                <p>{listing.descricao_aida.desejo}</p>
              </div>
              <div>
                <span className="font-semibold text-foreground">Ação:</span>
                <p>{listing.descricao_aida.acao}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="📦 Versão Clássico" copyText={listing.versao_classico}>
            <p className="whitespace-pre-wrap">{listing.versao_classico}</p>
          </SectionCard>

          <SectionCard title="⭐ Versão Premium" copyText={listing.versao_premium}>
            <p className="whitespace-pre-wrap">{listing.versao_premium}</p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="extras" className="space-y-4 m-0">
          <SectionCard title="✅ Bullet Points Técnicos" copyText={listing.bullet_points.join('\n')}>
            <ul className="space-y-1">
              {listing.bullet_points.map((point, i) => (
                <li key={i}>• {point}</li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="🧠 Gatilhos Mentais" copyText={`Urgência: ${listing.gatilhos_mentais.urgencia}\nProva Social: ${listing.gatilhos_mentais.prova_social}\nGarantia: ${listing.gatilhos_mentais.garantia}`}>
            <div className="space-y-2">
              <div>
                <span className="font-semibold text-destructive">⏰ Urgência:</span>
                <p>{listing.gatilhos_mentais.urgencia}</p>
              </div>
              <div>
                <span className="font-semibold text-primary">👥 Prova Social:</span>
                <p>{listing.gatilhos_mentais.prova_social}</p>
              </div>
              <div>
                <span className="font-semibold text-primary">🛡️ Garantia:</span>
                <p>{listing.gatilhos_mentais.garantia}</p>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4 m-0">
          <SectionCard 
            title="❓ FAQ Otimizado" 
            copyText={listing.faq.map(f => `P: ${f.pergunta}\nR: ${f.resposta}`).join('\n\n')}
          >
            <div className="space-y-4">
              {listing.faq.map((item, i) => (
                <div key={i} className="border-l-2 border-primary pl-3">
                  <p className="font-medium text-foreground">{item.pergunta}</p>
                  <p className="text-sm mt-1">{item.resposta}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}

export function ListingGeneratorDialog() {
  const [open, setOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  const { generate, generatedListing, rawContent, isLoading, reset } = useListingGenerator();

  const handleGenerate = async () => {
    if (!productName.trim()) return;
    
    await generate({
      productName: productName.trim(),
      category: category.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      additionalInfo: additionalInfo.trim() || undefined,
    });
  };

  const handleReset = () => {
    reset();
    setProductName('');
    setCategory('');
    setPrice('');
    setAdditionalInfo('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      handleReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Gerar com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerador de Anúncios com IA
          </DialogTitle>
          <DialogDescription>
            Crie anúncios profissionais otimizados para o Mercado Livre em segundos.
          </DialogDescription>
        </DialogHeader>

        {!generatedListing && !rawContent ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Nome do Produto *</Label>
              <Input
                id="productName"
                placeholder="Ex: Fone de Ouvido Bluetooth TWS com Cancelamento de Ruído"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria (opcional)</Label>
                <Input
                  id="category"
                  placeholder="Ex: Eletrônicos"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço (opcional)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Ex: 199.90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Informações Adicionais (opcional)</Label>
              <Textarea
                id="additionalInfo"
                placeholder="Descreva características, diferenciais, público-alvo, etc."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={!productName.trim() || isLoading}
              className="w-full gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando anúncio...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Anúncio Profissional
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="py-4">
            {generatedListing && <GeneratedContent listing={generatedListing} />}
            
            {rawContent && (
              <div className="space-y-4">
                <SectionCard title="Conteúdo Gerado" copyText={rawContent}>
                  <pre className="whitespace-pre-wrap text-xs">{rawContent}</pre>
                </SectionCard>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Gerar Novo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
