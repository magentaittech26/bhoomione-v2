<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LocationImportService
{
    /**
     * Import high-volume location master records safely and idempotently.
     * Supports a nested structured hierarchy array.
     */
    public function importHierarchy(array $statesData): array
    {
        $stats = [
            'states_created' => 0,
            'districts_created' => 0,
            'taluks_created' => 0,
            'cities_created' => 0,
            'villages_created' => 0,
            'pincodes_created' => 0,
        ];

        DB::transaction(function () use ($statesData, &$stats) {
            foreach ($statesData as $stateData) {
                $stateName = $this->normalizeName($stateData['name']);
                $stateCode = strtoupper(trim($stateData['code']));
                
                $state = DB::table('location_states')->where('code', $stateCode)->first();
                if (!$state) {
                    $stateId = DB::table('location_states')->insertGetId([
                        'name' => $stateName,
                        'code' => $stateCode,
                        'type' => $stateData['type'] ?? 'State',
                        'latitude' => $stateData['latitude'] ?? null,
                        'longitude' => $stateData['longitude'] ?? null,
                        'is_active' => true,
                        'source_ref' => $stateData['source_ref'] ?? 'Import Tool',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $stats['states_created']++;
                } else {
                    $stateId = $state->id;
                }

                // Import Districts
                if (isset($stateData['districts']) && is_array($stateData['districts'])) {
                    foreach ($stateData['districts'] as $distData) {
                        $distName = $this->normalizeName($distData['name']);
                        
                        $district = DB::table('location_districts')
                            ->where('state_id', $stateId)
                            ->where('name', $distName)
                            ->first();
                            
                        if (!$district) {
                            $districtId = DB::table('location_districts')->insertGetId([
                                'state_id' => $stateId,
                                'name' => $distName,
                                'latitude' => $distData['latitude'] ?? null,
                                'longitude' => $distData['longitude'] ?? null,
                                'is_active' => true,
                                'source_ref' => $distData['source_ref'] ?? 'Import Tool',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            $stats['districts_created']++;
                        } else {
                            $districtId = $district->id;
                        }

                        // Import Taluks
                        if (isset($distData['taluks']) && is_array($distData['taluks'])) {
                            foreach ($distData['taluks'] as $talukData) {
                                $talukName = $this->normalizeName($talukData['name']);
                                
                                $taluk = DB::table('location_taluks')
                                    ->where('district_id', $districtId)
                                    ->where('name', $talukName)
                                    ->first();
                                    
                                if (!$taluk) {
                                    $talukId = DB::table('location_taluks')->insertGetId([
                                        'district_id' => $districtId,
                                        'name' => $talukName,
                                        'latitude' => $talukData['latitude'] ?? null,
                                        'longitude' => $talukData['longitude'] ?? null,
                                        'is_active' => true,
                                        'source_ref' => $talukData['source_ref'] ?? 'Import Tool',
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ]);
                                    $stats['taluks_created']++;
                                } else {
                                    $talukId = $taluk->id;
                                }

                                // Import Villages
                                if (isset($talukData['villages']) && is_array($talukData['villages'])) {
                                    foreach ($talukData['villages'] as $vData) {
                                        $vName = $this->normalizeName($vData['name']);
                                        
                                        $village = DB::table('location_villages')
                                            ->where('taluk_id', $talukId)
                                            ->where('name', $vName)
                                            ->first();
                                            
                                        if (!$village) {
                                            $vId = DB::table('location_villages')->insertGetId([
                                                'taluk_id' => $talukId,
                                                'name' => $vName,
                                                'latitude' => $vData['latitude'] ?? null,
                                                'longitude' => $vData['longitude'] ?? null,
                                                'is_active' => true,
                                                'source_ref' => $vData['source_ref'] ?? 'Import Tool',
                                                'created_at' => now(),
                                                'updated_at' => now(),
                                            ]);
                                            $stats['villages_created']++;
                                        } else {
                                            $vId = $village->id;
                                        }

                                        // Link Pincode
                                        if (isset($vData['pincode'])) {
                                            $pin = trim($vData['pincode']);
                                            $existingPin = DB::table('location_pincodes')
                                                ->where('village_id', $vId)
                                                ->where('pincode', $pin)
                                                ->first();
                                                
                                            if (!$existingPin) {
                                                DB::table('location_pincodes')->insert([
                                                    'pincode' => $pin,
                                                    'village_id' => $vId,
                                                    'city_id' => null,
                                                    'latitude' => $vData['latitude'] ?? null,
                                                    'longitude' => $vData['longitude'] ?? null,
                                                    'is_active' => true,
                                                    'source_ref' => $vData['source_ref'] ?? 'Import Tool',
                                                    'created_at' => now(),
                                                    'updated_at' => now(),
                                                ]);
                                                $stats['pincodes_created']++;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Import Cities
                        if (isset($distData['cities']) && is_array($distData['cities'])) {
                            foreach ($distData['cities'] as $cityData) {
                                $cityName = $this->normalizeName($cityData['name']);
                                
                                $city = DB::table('location_cities')
                                    ->where('district_id', $districtId)
                                    ->where('name', $cityName)
                                    ->first();
                                    
                                if (!$city) {
                                    $cityId = DB::table('location_cities')->insertGetId([
                                        'district_id' => $districtId,
                                        'name' => $cityName,
                                        'latitude' => $cityData['latitude'] ?? null,
                                        'longitude' => $cityData['longitude'] ?? null,
                                        'is_active' => true,
                                        'source_ref' => $cityData['source_ref'] ?? 'Import Tool',
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ]);
                                    $stats['cities_created']++;
                                } else {
                                    $cityId = $city->id;
                                }

                                // Link Pincode
                                if (isset($cityData['pincode'])) {
                                    $pin = trim($cityData['pincode']);
                                    $existingPin = DB::table('location_pincodes')
                                        ->where('city_id', $cityId)
                                        ->where('pincode', $pin)
                                        ->first();
                                        
                                    if (!$existingPin) {
                                        DB::table('location_pincodes')->insert([
                                            'pincode' => $pin,
                                            'city_id' => $cityId,
                                            'village_id' => null,
                                            'latitude' => $cityData['latitude'] ?? null,
                                            'longitude' => $cityData['longitude'] ?? null,
                                            'is_active' => true,
                                            'source_ref' => $cityData['source_ref'] ?? 'Import Tool',
                                            'created_at' => now(),
                                            'updated_at' => now(),
                                        ]);
                                        $stats['pincodes_created']++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return $stats;
    }

    /**
     * Normalize name by removing extra whitespaces and standardizing casing.
     */
    private function normalizeName(string $name): string
    {
        $cleaned = preg_replace('/\s+/', ' ', trim($name));
        return Str::title($cleaned);
    }
}
