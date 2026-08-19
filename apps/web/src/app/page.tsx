import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="max-w-[375px] mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Tubi</h1>
      <Card>
        <CardHeader><CardTitle>Slice 0 listo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">shadcn + tema provisional funcionando.</p>
          <Button size="lg" className="w-full">Continuar</Button>
        </CardContent>
      </Card>
    </main>
  );
}
