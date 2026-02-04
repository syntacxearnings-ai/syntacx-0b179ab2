import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedListing {
  titulo: string;
  descricao_aida: {
    atencao: string;
    interesse: string;
    desejo: string;
    acao: string;
  };
  versao_classico: string;
  versao_premium: string;
  bullet_points: string[];
  texto_imagem: string;
  gatilhos_mentais: {
    urgencia: string;
    prova_social: string;
    garantia: string;
  };
  faq: Array<{ pergunta: string; resposta: string }>;
  sku: string;
}

interface GenerateParams {
  productName: string;
  category?: string;
  price?: number;
  additionalInfo?: string;
}

interface GenerateResponse {
  success: boolean;
  listing?: GeneratedListing;
  raw_content?: string;
  parsed: boolean;
  error?: string;
}

export function useListingGenerator() {
  const { toast } = useToast();
  const [generatedListing, setGeneratedListing] = useState<GeneratedListing | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (params: GenerateParams): Promise<GenerateResponse> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const fnBaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${fnBaseUrl}/functions/v1/meli-listing-generator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: params.productName,
          category: params.category,
          price: params.price,
          additional_info: params.additionalInfo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao gerar anúncio');
      }

      return response.json();
    },
    onSuccess: (result) => {
      if (result.parsed && result.listing) {
        setGeneratedListing(result.listing);
        setRawContent(null);
        toast({
          title: 'Anúncio gerado!',
          description: 'Copy profissional pronta para usar.',
        });
      } else if (result.raw_content) {
        setRawContent(result.raw_content);
        setGeneratedListing(null);
        toast({
          title: 'Anúncio gerado',
          description: 'Conteúdo gerado em formato texto.',
        });
      }
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar anúncio',
        description: error.message,
      });
    },
  });

  const generate = (params: GenerateParams) => {
    return generateMutation.mutateAsync(params);
  };

  const reset = () => {
    setGeneratedListing(null);
    setRawContent(null);
  };

  return {
    generate,
    reset,
    generatedListing,
    rawContent,
    isLoading: generateMutation.isPending,
    error: generateMutation.error,
  };
}
