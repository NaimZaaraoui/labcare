# NexLab Brand Identity V1

## Intention

NexLab doit inspirer trois choses en même temps:

- precision clinique
- fluidite numerique
- fiabilite calme

La marque ne doit pas ressembler a une startup gadget ni a un logiciel hospitalier generique.
Elle doit paraitre serieuse, nette, moderne et facile a faire confiance.

## Ce Qu Il Faut Eviter

- microscope, tube, ADN, goutte ou croix medicale trop litteraux
- bleu medical generique sur fond blanc
- logo trop technique ou trop agressif
- identite trop decorative par rapport a l usage LIS reel

Le microscope actuellement utilise dans la navigation fonctionne comme icone temporaire, mais il ne peut pas devenir le logo de marque final. Il est trop commun.

## Direction Recommandee

La meilleure piste pour NexLab est un monogramme abstrait autour du `N`.

Pourquoi:

- `N` est memorable
- il fonctionne bien en favicon, application, installateur et PDF
- il peut evoquer un flux, une trace, un trajet de donnees ou une chaine analytique
- il reste distinct sans tomber dans le cliche laboratoire

## Palette Recommandee

Palette principale:

- `Petrol 700`: `#0F4C5C`
- `Petrol 600`: `#176B7B`
- `Graphite 900`: `#1F2937`
- `Ivory 50`: `#F8F6F1`
- `Copper 500`: `#D7A86E`
- `Mist 200`: `#D6DEE2`

Roles:

- `Petrol` pour la confiance et le coeur de marque
- `Graphite` pour la structure, le texte fort et les applications pro
- `Ivory` pour adoucir l identite et eviter l aspect clinique froid
- `Copper` comme accent discret premium, jamais comme couleur dominante

## Typographie

Recommandation pratique pour rester coherents avec l app:

- wordmark et interface: `Plus Jakarta Sans`
- donnees techniques et codes: `JetBrains Mono`

Le logo doit venir de la forme, pas d une typo extravagante.

## Concepts De Logo

### Concept 1: Ribbon N

Fichier: `public/branding/nexlab-logo-ribbon.svg`

Idee:

- un `N` trace d un seul geste
- evoque la continuite, la circulation d information et la fiabilite
- le plus facile a memoriser
- le plus premium et intemporel

Verdict:

- meilleur candidat pour la marque principale

### Concept 2: Core N

Fichier: `public/branding/nexlab-logo-core.svg`

Idee:

- un `N` plus structure, plus logiciel, plus systeme
- un accent cuivre joue le role de point de controle ou de donnee critique
- bon pour une image produit robuste

Verdict:

- tres bon candidat si tu veux une marque plus logicielle que symbolique

### Concept 3: Frame N

Fichier: `public/branding/nexlab-logo-frame.svg`

Idee:

- un `N` installe dans un cadre instrument
- evoque la notion de poste de travail, d ecran, de systeme stabilise
- plus institutionnel

Verdict:

- utile si tu veux quelque chose de plus corporate, moins expressif

## Recommandation Finale

Si je devais choisir aujourd hui pour NexLab:

- logo principal: `Ribbon N`
- palette primaire: `Petrol + Graphite + Ivory`
- accent secondaire: `Copper`
- mot-symbole: `NexLab`, casse normale, pas tout en capitales

## Usage

Le logo doit pouvoir vivre dans ces contextes:

- favicon
- barre laterale
- page login
- page setup
- documents PDF
- installateur USB

Il doit rester propre en petit format, en monochrome et sur fond clair.

## Prochaine Etape

Avant de l integrer partout, je recommande:

1. choisir entre `Ribbon N` et `Core N`
2. definir si `Copper` reste un accent rare ou disparait totalement
3. remplacer le microscope dans `components/layout/NavigationBrand.tsx`
4. harmoniser ensuite `app/layout.tsx`, login, setup et PDF
