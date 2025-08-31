import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Helper function to calculate theme popularity metrics
async function calculateThemePopularityMetrics(timeRange: string) {
  const days = parseInt(timeRange);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get most popular themes
  const popularThemes = await prisma.themeAnalytics.groupBy({
    by: ['themeId', 'themeName'],
    _count: {
      id: true,
    },
    where: {
      selectedAt: {
        gte: startDate,
      },
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 5,
  });

  // Calculate average selections per theme
  const totalThemes = await prisma.themeAnalytics.groupBy({
    by: ['themeId'],
    where: {
      selectedAt: {
        gte: startDate,
      },
    },
  });

  const totalSelections = await prisma.themeAnalytics.count({
    where: {
      selectedAt: {
        gte: startDate,
      },
    },
  });

  const averageSelectionsPerTheme = totalThemes.length > 0 ? totalSelections / totalThemes.length : 0;

  return {
    mostPopular: popularThemes.map((theme, index) => ({
      rank: index + 1,
      themeId: theme.themeId,
      themeName: theme.themeName,
      selections: theme._count.id,
    })),
    averageSelectionsPerTheme: Math.round(averageSelectionsPerTheme * 100) / 100,
    totalUniqueThemes: totalThemes.length,
  };
}

// Helper function to calculate trending themes (comparing current vs previous period)
async function calculateTrendingThemes() {
  const currentPeriodStart = new Date();
  currentPeriodStart.setDate(currentPeriodStart.getDate() - 7); // Last 7 days
  
  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(previousPeriodStart.getDate() - 14); // 7-14 days ago
  const previousPeriodEnd = new Date();
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);

  // Current period theme usage
  const currentUsage = await prisma.themeAnalytics.groupBy({
    by: ['themeId', 'themeName'],
    _count: {
      id: true,
    },
    where: {
      selectedAt: {
        gte: currentPeriodStart,
      },
    },
  });

  // Previous period theme usage
  const previousUsage = await prisma.themeAnalytics.groupBy({
    by: ['themeId', 'themeName'],
    _count: {
      id: true,
    },
    where: {
      selectedAt: {
        gte: previousPeriodStart,
        lt: previousPeriodEnd,
      },
    },
  });

  // Calculate trends
  const trends = currentUsage.map((current) => {
    const previous = previousUsage.find(p => p.themeId === current.themeId);
    const previousCount = previous?._count.id || 0;
    const currentCount = current._count.id;
    
    const growthRate = previousCount > 0 
      ? ((currentCount - previousCount) / previousCount) * 100
      : currentCount > 0 ? 100 : 0;

    return {
      themeId: current.themeId,
      themeName: current.themeName,
      currentSelections: currentCount,
      previousSelections: previousCount,
      growthRate: Math.round(growthRate * 100) / 100,
      trend: growthRate > 10 ? 'rising' : growthRate < -10 ? 'falling' : 'stable',
    };
  });

  return trends
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 10);
}

// Helper function to calculate theme adoption rates
async function calculateThemeAdoptionRates() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get total catalogues created in the last 30 days
  const totalCatalogues = await prisma.catalogue.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  // Get theme selections in the last 30 days
  const themeSelections = await prisma.themeAnalytics.groupBy({
    by: ['themeId', 'themeName'],
    _count: {
      id: true,
    },
    where: {
      selectedAt: {
        gte: thirtyDaysAgo,
      },
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  const adoptionRates = themeSelections.map((theme) => ({
    themeId: theme.themeId,
    themeName: theme.themeName,
    selections: theme._count.id,
    adoptionRate: totalCatalogues > 0 ? ((theme._count.id / totalCatalogues) * 100).toFixed(2) : '0.00',
  }));

  return {
    totalCatalogues,
    themes: adoptionRates,
    averageAdoptionRate: adoptionRates.length > 0 
      ? (adoptionRates.reduce((sum, theme) => sum + parseFloat(theme.adoptionRate), 0) / adoptionRates.length).toFixed(2)
      : '0.00',
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user via Supabase
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin - only admin@catfy.com is allowed
    if (user.email !== 'admin@catfy.com') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get theme usage statistics
    const themeUsage = await prisma.themeAnalytics.groupBy({
      by: ['themeId', 'themeName'],
      _count: {
        id: true,
      },
      where: {
        selectedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get total theme selections
    const totalSelections = await prisma.themeAnalytics.count({
      where: {
        selectedAt: {
          gte: startDate,
        },
      },
    });

    // Get theme usage over time (daily)
    const dailyUsage = await prisma.themeAnalytics.groupBy({
      by: ['selectedAt'],
      _count: {
        id: true,
      },
      where: {
        selectedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        selectedAt: 'asc',
      },
    });

    // Process daily usage data
    const dailyUsageMap = new Map();
    dailyUsage.forEach((item) => {
      const date = item.selectedAt.toISOString().split('T')[0];
      dailyUsageMap.set(date, (dailyUsageMap.get(date) || 0) + item._count.id);
    });

    // Get unique users who selected themes
    const uniqueUsers = await prisma.themeAnalytics.groupBy({
      by: ['profileId'],
      where: {
        selectedAt: {
          gte: startDate,
        },
      },
    });

    // Get most recent theme selections
    const recentSelections = await prisma.themeAnalytics.findMany({
      take: 10,
      orderBy: {
        selectedAt: 'desc',
      },
      include: {
        profile: {
          select: {
            email: true,
            fullName: true,
          },
        },
        catalogue: {
          select: {
            name: true,
          },
        },
      },
      where: {
        selectedAt: {
          gte: startDate,
        },
      },
    });

    // Calculate theme popularity metrics
    const popularityMetrics = await calculateThemePopularityMetrics(timeRange);
    const trendingThemes = await calculateTrendingThemes();
    const adoptionRates = await calculateThemeAdoptionRates();

    const analytics = {
      totalSelections,
      uniqueUsers: uniqueUsers.length,
      timeRange: parseInt(timeRange),
      themeUsage: themeUsage.map((theme) => ({
        themeId: theme.themeId,
        themeName: theme.themeName,
        count: theme._count.id,
        percentage: ((theme._count.id / totalSelections) * 100).toFixed(1),
      })),
      dailyUsage: Array.from(dailyUsageMap.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      recentSelections: recentSelections.map((selection) => ({
        id: selection.id,
        themeId: selection.themeId,
        themeName: selection.themeName,
        selectedAt: selection.selectedAt,
        user: {
          email: selection.profile.email,
          name: selection.profile.fullName,
        },
        catalogue: {
          name: selection.catalogue.name,
        },
      })),
      popularityMetrics,
      trendingThemes,
      adoptionRates,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Theme analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Track theme selection
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { themeId, themeName, catalogueId } = body;

    if (!themeId || !themeName || !catalogueId) {
      return NextResponse.json(
        { error: 'Missing required fields: themeId, themeName, catalogueId' },
        { status: 400 }
      );
    }

    // Create theme analytics record
    const themeAnalytics = await prisma.themeAnalytics.create({
      data: {
        themeId,
        themeName,
        catalogueId,
        profileId: user.id,
        selectedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: themeAnalytics.id });
  } catch (error) {
    console.error('Theme tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}