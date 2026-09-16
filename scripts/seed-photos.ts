/**
 * Photos de démonstration : téléverse une image libre de droits dans la
 * médiathèque (donc sur Cloudinary) et la pose en image de couverture de chaque
 * contenu du seed qui n'en a pas.
 *
 *     pnpm payload --use-swc run ./scripts/seed-photos.ts
 *
 * Idempotent : une couverture choisie par la rédaction n'est jamais remplacée,
 * et un média déjà présent (même nom de fichier) est réutilisé — sauf si son
 * fichier est absent du CDN, auquel cas il est recréé et la couverture rebranchée.
 *
 * Toutes les images sont CC0 sauf Casablanca (CC BY-SA 2.0), dont le crédit est
 * obligatoire — il est saisi dans le champ `credit`, comme pour une vraie photo.
 * Elles viennent de la recherche Openverse ; `source` garde la page d'origine.
 *
 * À retirer avec le reste du seed quand la rédaction publie ses propres photos.
 */
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../payload.config'

type Target = {
  collection: 'articles' | 'dossiers' | 'podcasts'
  /** Le slug dans une locale où le contenu existe (un article AR-only n'a pas de slug FR). */
  locale: 'fr' | 'ar'
  slug: string
  file: string
  url: string
  credit: string
  source: string
  alt: { fr: string; ar: string }
}

const TARGETS: Target[] = [
  {
    collection: 'articles',
    locale: 'fr',
    slug: 'plateformes-numeriques-cadre-juridique-dedie',
    file: 'demo-plateformes-numeriques.jpg',
    url: 'https://images.rawpixel.com/editor_1024/cHJpdmF0ZS9zdGF0aWMvaW1hZ2Uvd2Vic2l0ZS8yMDIyLTA0L2xyL3B4NzE4NTktaW1hZ2Uta3d2djc0czIuanBn.jpg',
    credit: 'rawpixel — CC0',
    source: 'https://www.rawpixel.com/image/5906639/photo-image-light-desktop-wallpapers-public-domain',
    alt: {
      fr: 'Allées de baies de serveurs éclairées en bleu dans un centre de données',
      ar: 'صفوف خوادم مضاءة بالأزرق داخل مركز بيانات',
    },
  },
  {
    collection: 'articles',
    locale: 'fr',
    slug: 'donnees-personnelles-conformite-entreprises',
    file: 'demo-donnees-personnelles.jpg',
    url: 'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvcHg1NDU5OTQtaW1hZ2Uta3d2dmR5N3cuanBn.jpg',
    credit: 'rawpixel — CC0',
    source: 'https://www.rawpixel.com/image/5908216/image-background-public-domain-laptop',
    alt: {
      fr: 'Cadenas à code posé sur le clavier d’un ordinateur portable',
      ar: 'قفل برمز موضوع على لوحة مفاتيح حاسوب محمول',
    },
  },
  {
    collection: 'articles',
    locale: 'fr',
    slug: 'levees-de-fonds-premier-semestre',
    file: 'demo-levees-de-fonds.jpg',
    url: 'https://cdn.stocksnap.io/img-thumbs/960w/VQXYE2ZEHC.jpg',
    credit: 'Startup Stock Photos / StockSnap — CC0',
    source: 'https://stocksnap.io/photo/team-meeting-VQXYE2ZEHC',
    alt: {
      fr: 'Équipe réunie autour d’une table de travail avec ordinateurs et carnets',
      ar: 'فريق مجتمع حول طاولة عمل عليها حواسيب ودفاتر',
    },
  },
  {
    collection: 'articles',
    locale: 'fr',
    slug: 'marche-legaltech-marocain-etat-des-lieux',
    file: 'demo-legaltech.jpg',
    url: 'https://images.rawpixel.com/editor_1024/czNmcy1wcml2YXRlL3Jhd3BpeGVsX2ltYWdlcy93ZWJzaXRlX2NvbnRlbnQvbHIvZnJ1bHRyYWp1bF9qdWRpY2lhcl9pbl9ub3VsLWltYWdlLWt5YmNmbGN4LmpwZw.jpg',
    credit: 'rawpixel — CC0',
    source: 'https://www.rawpixel.com/image/6030458/photo-image-public-domain-room-free',
    alt: {
      fr: 'Marteau de juge posé devant un livre ouvert',
      ar: 'مطرقة قاض أمام كتاب مفتوح',
    },
  },
  {
    collection: 'articles',
    locale: 'fr',
    slug: 'mesures-encouragement-innovation-mode-emploi',
    file: 'demo-innovation.jpg',
    url: 'https://cdn.stocksnap.io/img-thumbs/960w/2VU3XNN1MA.jpg',
    credit: 'Direct Media / StockSnap — CC0',
    source: 'https://stocksnap.io/photo/women-working-2VU3XNN1MA',
    alt: {
      fr: 'Trois femmes échangent autour d’une tablette dans un bureau',
      ar: 'ثلاث نساء يتبادلن الحديث حول لوحة إلكترونية في مكتب',
    },
  },
  {
    collection: 'articles',
    locale: 'ar',
    slug: 'تطبيقات-مغربيه-خارج-الحدود',
    file: 'demo-applis-mobiles.jpg',
    url: 'https://cdn.stocksnap.io/img-thumbs/960w/BA9AFFE0BF.jpg',
    credit: 'Damian Zaleski / StockSnap — CC0',
    source: 'https://stocksnap.io/photo/mac-keyboard-BA9AFFE0BF',
    alt: {
      fr: 'Mains sur un clavier, un smartphone posé à côté',
      ar: 'يدان على لوحة مفاتيح وبجانبهما هاتف ذكي',
    },
  },
  {
    collection: 'dossiers',
    locale: 'fr',
    slug: 'financer-une-startup-au-maroc',
    file: 'demo-casablanca.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Casablanca_%281%29.jpg',
    credit: 'elchicogris / Wikimedia Commons — CC BY-SA 2.0',
    source: 'https://commons.wikimedia.org/w/index.php?curid=27202337',
    alt: {
      fr: 'Les toits de Casablanca au coucher du soleil, avec le minaret de la mosquée Hassan II',
      ar: 'أسطح الدار البيضاء عند الغروب مع صومعة مسجد الحسن الثاني',
    },
  },
  {
    collection: 'podcasts',
    locale: 'fr',
    slug: 'episode-1-demonstration',
    file: 'demo-podcast-micro.jpg',
    url: 'https://cdn.stocksnap.io/img-thumbs/960w/IQVHQYS3GL.jpg',
    credit: 'Maciej Korsan / StockSnap — CC0',
    source: 'https://stocksnap.io/photo/microphone-audio-IQVHQYS3GL',
    alt: {
      fr: 'Microphone de studio sur sa suspension',
      ar: 'ميكروفون استوديو على حامله',
    },
  },
]

/**
 * No revalidation from a CLI process: there is no Next runtime to call.
 *
 * A FUNCTION, NOT A SHARED CONSTANT — and the first run paid for it. Payload
 * uses the `context` object it is given as `req.context`, by reference, and
 * plugin-cloud-storage stashes the incoming file on it
 * (`context._payloadCloudStorage`, preserveFileData.js) only when nothing is
 * stashed yet. With one object shared by every call, the first upload of the
 * process reached Cloudinary and every later one silently did not: the Media
 * rows were created, their files never existed.
 */
const opts = () => ({ overrideAccess: true, context: { disableRevalidate: true } })

/** The CDN is the truth: a Media row whose file 404s is a broken row. */
async function fileExists(url: unknown): Promise<boolean> {
  if (typeof url !== 'string' || !url) return false
  const res = await fetch(url, { method: 'HEAD' }).catch(() => null)
  return Boolean(res?.ok)
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Al-Raqmana24 demo seed (+https://al-rakmana24.vercel.app)' },
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`)
    await new Promise((r) => setTimeout(r, 3000 * attempt))
  }
  throw new Error(`abandon après 4 essais : ${url}`)
}

async function mediaFor(payload: Payload, t: Target): Promise<string> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: t.file } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const found = existing.docs[0]
  if (found) {
    if (await fileExists(found.url)) return String(found.id)
    // Left behind by a failed upload: nothing on the CDN to keep.
    console.log(`  media ${found.id} sans fichier sur le CDN : recree`)
    await payload.delete({ collection: 'media', id: found.id, ...opts() })
  }

  // Re-encoded here so every upload stays far below Vercel's 4.5 MB body limit
  // and the original's EXIF (GPS included) never reaches the CDN.
  const data = await sharp(await download(t.url))
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()

  const doc = await payload.create({
    collection: 'media',
    locale: 'fr',
    data: { alt: t.alt.fr, credit: t.credit },
    file: { data, mimetype: 'image/jpeg', name: t.file, size: data.length },
    ...opts(),
  })
  await payload.update({
    collection: 'media',
    id: doc.id,
    locale: 'ar',
    data: { alt: t.alt.ar },
    ...opts(),
  })
  return String(doc.id)
}

const payload = await getPayload({ config })

let done = 0
let skipped = 0
try {
  for (const t of TARGETS) {
    const found = await payload.find({
      collection: t.collection,
      locale: t.locale,
      where: { slug: { equals: t.slug } },
      limit: 1,
      depth: 0,
      draft: false,
      overrideAccess: true,
    })
    const doc = found.docs[0] as { id: string | number; coverImage?: unknown } | undefined

    if (!doc) {
      console.log(`INTROUVABLE  ${t.collection} ${t.slug}`)
      continue
    }
    // A cover chosen by the newsroom is never replaced. Only ours (same file
    // name) is checked, and repaired if its upload never reached the CDN.
    const current = doc.coverImage
      ? await payload.findByID({ collection: 'media', id: String(doc.coverImage), depth: 0, overrideAccess: true, disableErrors: true })
      : null
    if (current && current.filename !== t.file) {
      console.log(`deja illustre ${t.collection} ${t.slug}`)
      skipped += 1
      continue
    }

    const mediaId = await mediaFor(payload, t)
    if (String(doc.coverImage ?? '') === mediaId) {
      console.log(`deja illustre ${t.collection} ${t.slug}`)
      skipped += 1
      continue
    }
    await payload.update({
      collection: t.collection,
      id: doc.id,
      // The locale the content exists in: required localized fields are
      // validated for it, and an AR-only article has no French title.
      locale: t.locale,
      data: { coverImage: mediaId },
      ...opts(),
    })
    console.log(`OK  ${t.collection} ${t.slug} <- media ${mediaId}`)
    done += 1
  }
} finally {
  console.log(`\n${done} couverture(s) posee(s), ${skipped} deja en place.`)
  await payload.destroy?.()
}
process.exit(0)
