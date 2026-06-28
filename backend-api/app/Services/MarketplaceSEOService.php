<?php

namespace App\Services;

use App\Models\Project;
use App\Models\DeveloperProfile;

class MarketplaceSEOService
{
    /**
     * Generate SEO metadata for a project.
     */
    public function generateProjectSEO(Project $project): array
    {
        $seo = $project->seo_settings ?: [];
        
        if (empty($seo['meta_title'])) {
            $seo['meta_title'] = $project->name . " | Developed by " . $project->developer_name;
        }
        
        if (empty($seo['meta_description'])) {
            $seo['meta_description'] = "Explore " . $project->name . " located at " . $project->location . ". View layouts, prices, and plot availabilities.";
        }
        
        $seo['canonical'] = $seo['canonical'] ?? "https://bhoomione.com/marketplace/projects/" . $project->id;
        
        $seo['open_graph'] = array_merge([
            'title' => $seo['meta_title'],
            'description' => $seo['meta_description'],
            'type' => 'website',
            'url' => $seo['canonical'],
            'image' => 'https://bhoomione.com/assets/project-fallback.jpg'
        ], $seo['open_graph'] ?? []);
        
        $seo['twitter_card'] = [
            'card' => 'summary_large_image',
            'title' => $seo['meta_title'],
            'description' => $seo['meta_description']
        ];

        // JSON-LD dynamic generation
        $seo['json_ld'] = [
            '@context' => 'https://schema.org',
            '@type' => 'RealEstateAgent',
            'name' => $project->developer_name,
            'url' => $seo['canonical'],
            'description' => $seo['meta_description'],
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => $project->location
            ]
        ];

        // Breadcrumbs Schema
        $seo['breadcrumbs_schema'] = [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => [
                [
                    '@type' => 'ListItem',
                    'position' => 1,
                    'name' => 'Marketplace',
                    'item' => 'https://bhoomione.com/marketplace'
                ],
                [
                    '@type' => 'ListItem',
                    'position' => 2,
                    'name' => $project->name,
                    'item' => $seo['canonical']
                ]
            ]
        ];

        return $seo;
    }

    /**
     * Generate SEO metadata for a developer profile.
     */
    public function generateDeveloperSEO(DeveloperProfile $dev): array
    {
        return [
            'meta_title' => $dev->company_name . " | Certified Developer",
            'meta_description' => $dev->description ?: "View RERA registered residential layout projects, plots, and premium land catalogs by " . $dev->company_name . ".",
            'canonical' => "https://bhoomione.com/marketplace/developers/" . $dev->seo_slug,
            'open_graph' => [
                'title' => $dev->company_name,
                'description' => $dev->description,
                'url' => "https://bhoomione.com/marketplace/developers/" . $dev->seo_slug,
                'image' => $dev->logo ?: 'https://bhoomione.com/assets/developer-fallback.jpg'
            ],
            'twitter_card' => [
                'card' => 'summary',
                'title' => $dev->company_name,
                'description' => $dev->description
            ],
            'json_ld' => [
                '@context' => 'https://schema.org',
                '@type' => 'LocalBusiness',
                'name' => $dev->company_name,
                'url' => "https://bhoomione.com/marketplace/developers/" . $dev->seo_slug,
                'telephone' => $dev->phone,
                'email' => $dev->email,
                'address' => [
                    '@type' => 'PostalAddress',
                    'streetAddress' => $dev->office_address
                ]
            ],
            'breadcrumbs_schema' => [
                '@context' => 'https://schema.org',
                '@type' => 'BreadcrumbList',
                'itemListElement' => [
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Marketplace',
                        'item' => 'https://bhoomione.com/marketplace'
                    ],
                    [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => $dev->company_name,
                        'item' => "https://bhoomione.com/marketplace/developers/" . $dev->seo_slug
                    ]
                ]
            ]
        ];
    }
}
