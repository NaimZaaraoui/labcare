import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[API /categories] Fetching categories...');
    const categories = await prisma.category.findMany({
      include: {
        tests: {
          orderBy: { rank: 'asc' }
        },
        children: true,
        parent: true
      },
      orderBy: { rank: 'asc' }
    });
    console.log(`[API /categories] Found ${categories.length} categories`);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('[API /categories] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, parentId, icon } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Vérifier unicité
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'Une catégorie avec ce nom existe déjà' 
      }, { status: 409 });
    }

    // Vérifier que le parent existe si fourni
    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId }
      });
      if (!parentExists) {
        return NextResponse.json({ 
          error: 'Catégorie parente introuvable' 
        }, { status: 404 });
      }
    }

    // Créer la catégorie
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        icon: icon || null,
        rank: 999 // Nouvelle catégorie en fin de liste
      },
      include: {
        parent: true,
        children: true
      }
    });

    console.log(`[API /categories] Created category: ${category.name}`);
    return NextResponse.json(category, { status: 201 });

  } catch (error) {
    console.error('[API /categories POST] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, icon, parentId } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Vérifier que la catégorie existe
    const existing = await prisma.category.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
    }

    // Si le nom change, vérifier l'unicité
    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: name.trim() }
      });
      if (duplicate) {
        return NextResponse.json({ 
          error: 'Une catégorie avec ce nom existe déjà' 
        }, { status: 409 });
      }
    }

    // Vérifier que le parent existe si fourni
    if (parentId && parentId !== existing.parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId }
      });
      if (!parentExists) {
        return NextResponse.json({ 
          error: 'Catégorie parente introuvable' 
        }, { status: 404 });
      }

      // Empêcher les boucles (une catégorie ne peut pas être son propre parent)
      if (parentId === id) {
        return NextResponse.json({ 
          error: 'Une catégorie ne peut pas être son propre parent' 
        }, { status: 400 });
      }
    }

    // Mettre à jour
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId: parentId || null })
      },
      include: {
        parent: true,
        children: true
      }
    });

    console.log(`[API /categories] Updated category: ${category.name}`);
    return NextResponse.json(category);

  } catch (error) {
    console.error('[API /categories PUT] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        tests: true,
        children: true
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
    }

    // Vérifier qu'elle n'a pas de tests
    if (category.tests.length > 0) {
      return NextResponse.json({ 
        error: `Impossible de supprimer : ${category.tests.length} test(s) appartiennent à cette catégorie` 
      }, { status: 400 });
    }

    // Vérifier qu'elle n'a pas d'enfants
    if (category.children.length > 0) {
      return NextResponse.json({ 
        error: `Impossible de supprimer : ${category.children.length} sous-catégorie(s) existent` 
      }, { status: 400 });
    }

    // Supprimer
    await prisma.category.delete({
      where: { id }
    });

    console.log(`[API /categories] Deleted category: ${category.name}`);
    return NextResponse.json({ success: true, message: 'Catégorie supprimée' });

  } catch (error) {
    console.error('[API /categories DELETE] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
