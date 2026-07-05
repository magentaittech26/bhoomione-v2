<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. States
        $states = [
            ['name' => 'Karnataka', 'code' => 'KA'],
            ['name' => 'Maharashtra', 'code' => 'MH'],
            ['name' => 'Tamil Nadu', 'code' => 'TN'],
            ['name' => 'Telangana', 'code' => 'TG'],
            ['name' => 'Haryana', 'code' => 'HR'],
        ];

        $stateIds = [];
        foreach ($states as $s) {
            $existing = DB::table('location_states')->where('code', $s['code'])->first();
            if (!$existing) {
                $id = DB::table('location_states')->insertGetId([
                    'name' => $s['name'],
                    'code' => $s['code'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $id = $existing->id;
                // Update name if mismatch
                if ($existing->name !== $s['name']) {
                    DB::table('location_states')->where('id', $id)->update(['name' => $s['name'], 'updated_at' => now()]);
                }
            }
            $stateIds[$s['code']] = $id;
        }

        $kaId = $stateIds['KA'] ?? null;
        $mhId = $stateIds['MH'] ?? null;
        $hrId = $stateIds['HR'] ?? null;

        if ($kaId) {
            // Karnataka Districts
            $districts = ['Bangalore Urban', 'Mysore', 'Dharwad'];
            $districtIds = [];
            foreach ($districts as $dName) {
                $existing = DB::table('location_districts')->where('state_id', $kaId)->where('name', $dName)->first();
                if (!$existing) {
                    $id = DB::table('location_districts')->insertGetId([
                        'state_id' => $kaId,
                        'name' => $dName,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $id = $existing->id;
                }
                $districtIds[$dName] = $id;
            }

            // Bangalore Urban Taluks
            $blrId = $districtIds['Bangalore Urban'] ?? null;
            if ($blrId) {
                $blrTaluks = ['Bangalore North', 'Bangalore East', 'Bangalore South'];
                $blrTalukIds = [];
                foreach ($blrTaluks as $tName) {
                    $existing = DB::table('location_taluks')->where('district_id', $blrId)->where('name', $tName)->first();
                    if (!$existing) {
                        $id = DB::table('location_taluks')->insertGetId([
                            'district_id' => $blrId,
                            'name' => $tName,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $id = $existing->id;
                    }
                    $blrTalukIds[$tName] = $id;
                }

                // Bangalore Cities
                $blrCities = ['Bangalore City', 'Yelahanka Town', 'Kengeri'];
                foreach ($blrCities as $cName) {
                    $existing = DB::table('location_cities')->where('district_id', $blrId)->where('name', $cName)->first();
                    if (!$existing) {
                        DB::table('location_cities')->insert([
                            'district_id' => $blrId,
                            'name' => $cName,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }

                // Bangalore North Villages
                $bnId = $blrTalukIds['Bangalore North'] ?? null;
                if ($bnId) {
                    $bnVillages = ['Hebbal', 'Yelahanka', 'Manyata Tech Park Area', 'Thanisandra'];
                    foreach ($bnVillages as $vName) {
                        $existing = DB::table('location_villages')->where('taluk_id', $bnId)->where('name', $vName)->first();
                        if (!$existing) {
                            DB::table('location_villages')->insert([
                                'taluk_id' => $bnId,
                                'name' => $vName,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // Bangalore East Villages
                $beId = $blrTalukIds['Bangalore East'] ?? null;
                if ($beId) {
                    $beVillages = ['Whitefield', 'Marathahalli', 'Bellandur', 'Varthur'];
                    foreach ($beVillages as $vName) {
                        $existing = DB::table('location_villages')->where('taluk_id', $beId)->where('name', $vName)->first();
                        if (!$existing) {
                            DB::table('location_villages')->insert([
                                'taluk_id' => $beId,
                                'name' => $vName,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // Bangalore South Villages
                $bsId = $blrTalukIds['Bangalore South'] ?? null;
                if ($bsId) {
                    $bsVillages = ['Electronic City Phase 1', 'Begur', 'Hulimavu'];
                    foreach ($bsVillages as $vName) {
                        $existing = DB::table('location_villages')->where('taluk_id', $bsId)->where('name', $vName)->first();
                        if (!$existing) {
                            DB::table('location_villages')->insert([
                                'taluk_id' => $bsId,
                                'name' => $vName,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }

            // Mysore Taluks & Cities
            $mysId = $districtIds['Mysore'] ?? null;
            if ($mysId) {
                $existingTaluk = DB::table('location_taluks')->where('district_id', $mysId)->where('name', 'Mysore Taluk')->first();
                if (!$existingTaluk) {
                    $mysTalukId = DB::table('location_taluks')->insertGetId([
                        'district_id' => $mysId,
                        'name' => 'Mysore Taluk',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $mysTalukId = $existingTaluk->id;
                }

                // Mysore Cities
                $existingCity = DB::table('location_cities')->where('district_id', $mysId)->where('name', 'Mysuru')->first();
                if (!$existingCity) {
                    DB::table('location_cities')->insert([
                        'district_id' => $mysId,
                        'name' => 'Mysuru',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // Mysore Villages
                $mysVillages = ['Gokulam', 'Vijayanagar', 'Chamundi Hill'];
                foreach ($mysVillages as $vName) {
                    $existing = DB::table('location_villages')->where('taluk_id', $mysTalukId)->where('name', $vName)->first();
                    if (!$existing) {
                        DB::table('location_villages')->insert([
                            'taluk_id' => $mysTalukId,
                            'name' => $vName,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            // Dharwad Taluks, Cities & Villages (REQ: Dharwad district, Hubli / Hubballi, Dharwad, common taluks/villages/localities)
            $dwdId = $districtIds['Dharwad'] ?? null;
            if ($dwdId) {
                $dwdTaluks = ['Hubli', 'Dharwad', 'Kalghatgi', 'Navalgund', 'Kundgol'];
                $dwdTalukIds = [];
                foreach ($dwdTaluks as $tName) {
                    $existing = DB::table('location_taluks')->where('district_id', $dwdId)->where('name', $tName)->first();
                    if (!$existing) {
                        $id = DB::table('location_taluks')->insertGetId([
                            'district_id' => $dwdId,
                            'name' => $tName,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $id = $existing->id;
                    }
                    $dwdTalukIds[$tName] = $id;
                }

                // Dharwad Cities
                $dwdCities = ['Hubballi', 'Dharwad City', 'Kalghatgi Town', 'Navalgund Town'];
                foreach ($dwdCities as $cName) {
                    $existing = DB::table('location_cities')->where('district_id', $dwdId)->where('name', $cName)->first();
                    if (!$existing) {
                        DB::table('location_cities')->insert([
                            'district_id' => $dwdId,
                            'name' => $cName,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }

                // Hubli Villages / Localities
                $hubliTalukId = $dwdTalukIds['Hubli'] ?? null;
                if ($hubliTalukId) {
                    $hubliVillages = ['Gokul Road', 'Vidyanagar', 'Keshwapur', 'Shirur Park', 'Bairidevarkoppa', 'Unkal'];
                    foreach ($hubliVillages as $vName) {
                        $existing = DB::table('location_villages')->where('taluk_id', $hubliTalukId)->where('name', $vName)->first();
                        if (!$existing) {
                            DB::table('location_villages')->insert([
                                'taluk_id' => $hubliTalukId,
                                'name' => $vName,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // Dharwad Villages / Localities
                $dharwadTalukId = $dwdTalukIds['Dharwad'] ?? null;
                if ($dharwadTalukId) {
                    $dharwadVillages = ['Saptapur', 'Nisarga Layout', 'Malmaddi', 'Lakamanahalli', 'Hebballi Village', 'Narendra'];
                    foreach ($dharwadVillages as $vName) {
                        $existing = DB::table('location_villages')->where('taluk_id', $dharwadTalukId)->where('name', $vName)->first();
                        if (!$existing) {
                            DB::table('location_villages')->insert([
                                'taluk_id' => $dharwadTalukId,
                                'name' => $vName,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }
        }

        if ($mhId) {
            // Maharashtra Districts
            $districts = ['Mumbai Suburban', 'Pune'];
            $districtIds = [];
            foreach ($districts as $dName) {
                $existing = DB::table('location_districts')->where('state_id', $mhId)->where('name', $dName)->first();
                if (!$existing) {
                    $id = DB::table('location_districts')->insertGetId([
                        'state_id' => $mhId,
                        'name' => $dName,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $id = $existing->id;
                }
                $districtIds[$dName] = $id;
            }

            // Mumbai Suburban Taluks, Cities & Villages
            $mumId = $districtIds['Mumbai Suburban'] ?? null;
            if ($mumId) {
                $existingTaluk = DB::table('location_taluks')->where('district_id', $mumId)->where('name', 'Andheri')->first();
                if (!$existingTaluk) {
                    $andheriId = DB::table('location_taluks')->insertGetId([
                        'district_id' => $mumId,
                        'name' => 'Andheri',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $andheriId = $existingTaluk->id;
                }

                $existingCity = DB::table('location_cities')->where('district_id', $mumId)->where('name', 'Mumbai')->first();
                if (!$existingCity) {
                    DB::table('location_cities')->insert([
                        'district_id' => $mumId,
                        'name' => 'Mumbai',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $mumVillages = ['Bandra West', 'Juhu', 'Lokhandwala'];
                foreach ($mumVillages as $vName) {
                    $existing = DB::table('location_villages')->where('taluk_id', $andheriId)->where('name', $vName)->first();
                    if (!$existing) {
                        DB::table('location_villages')->insert([
                            'taluk_id' => $andheriId,
                            'name' => $vName,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            // Pune Taluks, Cities & Villages
            $puneId = $districtIds['Pune'] ?? null;
            if ($puneId) {
                $existingTaluk = DB::table('location_taluks')->where('district_id', $puneId)->where('name', 'Haveli')->first();
                if (!$existingTaluk) {
                    $haveliId = DB::table('location_taluks')->insertGetId([
                        'district_id' => $puneId,
                        'name' => 'Haveli',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $haveliId = $existingTaluk->id;
                }

                $existingCity = DB::table('location_cities')->where('district_id', $puneId)->where('name', 'Pune')->first();
                if (!$existingCity) {
                    DB::table('location_cities')->insert([
                        'district_id' => $puneId,
                        'name' => 'Pune',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $puneVillages = ['Hinjawadi', 'Baner', 'Hadapsar'];
                foreach ($puneVillages as $vName) {
                    $existing = DB::table('location_villages')->where('taluk_id', $haveliId)->where('name', $vName)->first();
                    if (!$existing) {
                        DB::table('location_villages')->insert([
                            'taluk_id' => $haveliId,
                            'name' => $vName,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }

        if ($hrId) {
            // Haryana Districts
            $existingDist = DB::table('location_districts')->where('state_id', $hrId)->where('name', 'Gurgaon')->first();
            if (!$existingDist) {
                $gurgaonId = DB::table('location_districts')->insertGetId([
                    'state_id' => $hrId,
                    'name' => 'Gurgaon',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $gurgaonId = $existingDist->id;
            }

            // Gurgaon Taluks
            $existingTaluk = DB::table('location_taluks')->where('district_id', $gurgaonId)->where('name', 'Gurgaon Taluk')->first();
            if (!$existingTaluk) {
                $gurgaonTalukId = DB::table('location_taluks')->insertGetId([
                    'district_id' => $gurgaonId,
                    'name' => 'Gurgaon Taluk',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $gurgaonTalukId = $existingTaluk->id;
            }

            // Gurgaon Cities
            $existingCity = DB::table('location_cities')->where('district_id', $gurgaonId)->where('name', 'Gurugram')->first();
            if (!$existingCity) {
                DB::table('location_cities')->insert([
                    'district_id' => $gurgaonId,
                    'name' => 'Gurugram',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Gurgaon Villages
            $hrVillages = ['Sector 15', 'Sector 45', 'Sohna'];
            foreach ($hrVillages as $vName) {
                $existing = DB::table('location_villages')->where('taluk_id', $gurgaonTalukId)->where('name', $vName)->first();
                if (!$existing) {
                    DB::table('location_villages')->insert([
                        'taluk_id' => $gurgaonTalukId,
                        'name' => $vName,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
