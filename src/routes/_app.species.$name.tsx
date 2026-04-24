import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Info, Grid, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listUserSightings } from "@/services/sightings";
import { findSpecies } from "@/data/species";
import { formatRelativeTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/species/$name")({
  head: ({ params }) => ({ meta: [{ title: `${params.name} — Pok Wildlife` }] }),
  component: SpeciesDetailScreen,
});

function SpeciesDetailScreen() {
  const { name } = Route.useParams();
  const { user } = useAuth();
  
  const species = findSpecies(name);
  
  const { data: allMySightings = [], isLoading } = useQuery({
    queryKey: ["sightings", "user", user?.id],
    queryFn: () => listUserSightings(user!.id),
    enabled: !!user,
  });

  const mySightings = allMySightings.filter(s => s.speciesName === name);

  if (!species) return <div>Species not found</div>;

  return (
    <div className="min-h-dvh pb-32 bg-background safe-top">
      {/* Header */}
      <div className="px-5 py-6 flex items-center gap-4 border-b border-border/50 bg-card/30 backdrop-blur sticky top-0 z-10">
        <Link to="/home" className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-extrabold truncate flex-1">{name}</h1>
        <span className="text-4xl">{species.emoji}</span>
      </div>

      <div className="p-5 space-y-8">
        {/* Rarity Info */}
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rarity & Info</h2>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-card to-secondary/30 p-5 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Rarity Score</span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest",
                species.rarityScore > 75 ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
              )}>
                {species.rarityScore > 75 ? "Legendary" : species.rarityScore > 40 ? "Rare" : "Common"}
              </span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000" 
                style={{ width: `${species.rarityScore}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-foreground/80 leading-relaxed">
              This species is known for its {species.rarityScore > 50 ? "elusive nature and unique habitat requirements." : "adaptability and presence in diverse environments."}
            </p>
          </div>
        </section>

        {/* My Stats */}
        <section className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Sightings</p>
            <p className="text-3xl font-black text-foreground">{mySightings.length}</p>
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Pts</p>
            <p className="text-3xl font-black text-primary">
              {mySightings.reduce((sum, s) => sum + s.score, 0)}
            </p>
          </div>
        </section>

        {/* Gallery */}
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-500 delay-150">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">My Gallery</h2>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square rounded-2xl skeleton" />)}
            </div>
          ) : mySightings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {mySightings.map(s => (
                <div key={s.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50 shadow-sm">
                  <img src={s.imageUrl} alt={s.speciesName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-[10px] text-white/80 font-medium flex items-center gap-1">
                      <MapPin className="h-2 w-2" /> {formatRelativeTime(s.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <Grid className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">You haven't captured this species yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
