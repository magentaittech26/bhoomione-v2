<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LocationMasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. All 28 States & 8 Union Territories of India
        $states = [
            // States
            ['name' => 'Andhra Pradesh', 'code' => 'AP', 'type' => 'State', 'lat' => 15.9129, 'lng' => 79.7400],
            ['name' => 'Arunachal Pradesh', 'code' => 'AR', 'type' => 'State', 'lat' => 28.2180, 'lng' => 94.7278],
            ['name' => 'Assam', 'code' => 'AS', 'type' => 'State', 'lat' => 26.2006, 'lng' => 92.9376],
            ['name' => 'Bihar', 'code' => 'BR', 'type' => 'State', 'lat' => 25.0961, 'lng' => 85.3131],
            ['name' => 'Chhattisgarh', 'code' => 'CG', 'type' => 'State', 'lat' => 21.2787, 'lng' => 81.8661],
            ['name' => 'Goa', 'code' => 'GA', 'type' => 'State', 'lat' => 15.2993, 'lng' => 74.1240],
            ['name' => 'Gujarat', 'code' => 'GJ', 'type' => 'State', 'lat' => 22.2587, 'lng' => 71.1924],
            ['name' => 'Haryana', 'code' => 'HR', 'type' => 'State', 'lat' => 29.0588, 'lng' => 76.0856],
            ['name' => 'Himachal Pradesh', 'code' => 'HP', 'type' => 'State', 'lat' => 31.1048, 'lng' => 77.1734],
            ['name' => 'Jharkhand', 'code' => 'JH', 'type' => 'State', 'lat' => 23.6102, 'lng' => 85.2799],
            ['name' => 'Karnataka', 'code' => 'KA', 'type' => 'State', 'lat' => 15.3173, 'lng' => 75.7139],
            ['name' => 'Kerala', 'code' => 'KL', 'type' => 'State', 'lat' => 10.8505, 'lng' => 76.2711],
            ['name' => 'Madhya Pradesh', 'code' => 'MP', 'type' => 'State', 'lat' => 22.9734, 'lng' => 78.6569],
            ['name' => 'Maharashtra', 'code' => 'MH', 'type' => 'State', 'lat' => 19.7515, 'lng' => 75.7139],
            ['name' => 'Manipur', 'code' => 'MN', 'type' => 'State', 'lat' => 24.6637, 'lng' => 93.9063],
            ['name' => 'Meghalaya', 'code' => 'ML', 'type' => 'State', 'lat' => 25.4670, 'lng' => 91.3662],
            ['name' => 'Mizoram', 'code' => 'MZ', 'type' => 'State', 'lat' => 23.1645, 'lng' => 92.9376],
            ['name' => 'Nagaland', 'code' => 'NL', 'type' => 'State', 'lat' => 26.1584, 'lng' => 94.5624],
            ['name' => 'Odisha', 'code' => 'OD', 'type' => 'State', 'lat' => 20.9517, 'lng' => 85.0985],
            ['name' => 'Punjab', 'code' => 'PB', 'type' => 'State', 'lat' => 31.1471, 'lng' => 75.3412],
            ['name' => 'Rajasthan', 'code' => 'RJ', 'type' => 'State', 'lat' => 27.0238, 'lng' => 74.2179],
            ['name' => 'Sikkim', 'code' => 'SK', 'type' => 'State', 'lat' => 27.5330, 'lng' => 88.5122],
            ['name' => 'Tamil Nadu', 'code' => 'TN', 'type' => 'State', 'lat' => 11.1271, 'lng' => 78.6569],
            ['name' => 'Telangana', 'code' => 'TG', 'type' => 'State', 'lat' => 18.1124, 'lng' => 79.0193],
            ['name' => 'Tripura', 'code' => 'TR', 'type' => 'State', 'lat' => 23.9408, 'lng' => 91.9882],
            ['name' => 'Uttar Pradesh', 'code' => 'UP', 'type' => 'State', 'lat' => 26.8467, 'lng' => 80.9462],
            ['name' => 'Uttarakhand', 'code' => 'UK', 'type' => 'State', 'lat' => 30.0668, 'lng' => 79.0193],
            ['name' => 'West Bengal', 'code' => 'WB', 'type' => 'State', 'lat' => 22.9868, 'lng' => 87.8550],

            // Union Territories
            ['name' => 'Andaman and Nicobar Islands', 'code' => 'AN', 'type' => 'Union Territory', 'lat' => 11.7401, 'lng' => 92.6586],
            ['name' => 'Chandigarh', 'code' => 'CH', 'type' => 'Union Territory', 'lat' => 30.7333, 'lng' => 76.7794],
            ['name' => 'Dadra and Nagar Haveli and Daman and Diu', 'code' => 'DN', 'type' => 'Union Territory', 'lat' => 20.1809, 'lng' => 73.0169],
            ['name' => 'Delhi', 'code' => 'DL', 'type' => 'Union Territory', 'lat' => 28.7041, 'lng' => 77.1025],
            ['name' => 'Jammu and Kashmir', 'code' => 'JK', 'type' => 'Union Territory', 'lat' => 33.7782, 'lng' => 76.5762],
            ['name' => 'Ladakh', 'code' => 'LA', 'type' => 'Union Territory', 'lat' => 34.1526, 'lng' => 77.5771],
            ['name' => 'Lakshadweep', 'code' => 'LD', 'type' => 'Union Territory', 'lat' => 10.5667, 'lng' => 72.6333],
            ['name' => 'Puducherry', 'code' => 'PY', 'type' => 'Union Territory', 'lat' => 11.9416, 'lng' => 79.8083],
        ];

        $stateIds = [];
        foreach ($states as $s) {
            $existing = DB::table('location_states')->where('code', $s['code'])->first();
            if (!$existing) {
                $id = DB::table('location_states')->insertGetId([
                    'name' => $s['name'],
                    'code' => $s['code'],
                    'type' => $s['type'],
                    'latitude' => $s['lat'],
                    'longitude' => $s['lng'],
                    'is_active' => true,
                    'source_ref' => 'Government Census 2011',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $id = $existing->id;
                // Update properties to ensure they match
                DB::table('location_states')->where('id', $id)->update([
                    'name' => $s['name'],
                    'type' => $s['type'],
                    'latitude' => $s['lat'],
                    'longitude' => $s['lng'],
                    'updated_at' => now(),
                ]);
            }
            $stateIds[$s['code']] = $id;
        }

        // 2. Karnataka State Deep Seeding (District -> Taluk -> City -> Village -> Pincode)
        $kaId = $stateIds['KA'] ?? null;
        if ($kaId) {
            $districts = [
                ['name' => 'Bangalore Urban', 'lat' => 12.9716, 'lng' => 77.5946],
                ['name' => 'Mysore', 'lat' => 12.2958, 'lng' => 76.6394],
                ['name' => 'Dharwad', 'lat' => 15.4589, 'lng' => 75.0078],
                ['name' => 'Belagavi', 'lat' => 15.8497, 'lng' => 74.4977],
                ['name' => 'Dakshina Kannada', 'lat' => 12.8701, 'lng' => 74.8827],
            ];

            $districtIds = [];
            foreach ($districts as $d) {
                $existing = DB::table('location_districts')->where('state_id', $kaId)->where('name', $d['name'])->first();
                if (!$existing) {
                    $id = DB::table('location_districts')->insertGetId([
                        'state_id' => $kaId,
                        'name' => $d['name'],
                        'latitude' => $d['lat'],
                        'longitude' => $d['lng'],
                        'is_active' => true,
                        'source_ref' => 'Government Census 2011',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $id = $existing->id;
                    DB::table('location_districts')->where('id', $id)->update([
                        'latitude' => $d['lat'],
                        'longitude' => $d['lng'],
                        'updated_at' => now(),
                    ]);
                }
                $districtIds[$d['name']] = $id;
            }

            // Bangalore Urban Detail
            $blrId = $districtIds['Bangalore Urban'] ?? null;
            if ($blrId) {
                // Taluks
                $blrTaluks = [
                    ['name' => 'Bangalore North', 'lat' => 13.0358, 'lng' => 77.5978],
                    ['name' => 'Bangalore East', 'lat' => 12.9719, 'lng' => 77.7500],
                    ['name' => 'Bangalore South', 'lat' => 12.8441, 'lng' => 77.5012],
                ];
                $blrTalukIds = [];
                foreach ($blrTaluks as $t) {
                    $existing = DB::table('location_taluks')->where('district_id', $blrId)->where('name', $t['name'])->first();
                    if (!$existing) {
                        $id = DB::table('location_taluks')->insertGetId([
                            'district_id' => $blrId,
                            'name' => $t['name'],
                            'latitude' => $t['lat'],
                            'longitude' => $t['lng'],
                            'is_active' => true,
                            'source_ref' => 'Government Census 2011',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $id = $existing->id;
                    }
                    $blrTalukIds[$t['name']] = $id;
                }

                // Cities
                $blrCities = [
                    ['name' => 'Bangalore City', 'lat' => 12.9716, 'lng' => 77.5946],
                    ['name' => 'Yelahanka Town', 'lat' => 13.1007, 'lng' => 77.5963],
                    ['name' => 'Kengeri', 'lat' => 12.9090, 'lng' => 77.4853],
                ];
                $blrCityIds = [];
                foreach ($blrCities as $c) {
                    $existing = DB::table('location_cities')->where('district_id', $blrId)->where('name', $c['name'])->first();
                    if (!$existing) {
                        $id = DB::table('location_cities')->insertGetId([
                            'district_id' => $blrId,
                            'name' => $c['name'],
                            'latitude' => $c['lat'],
                            'longitude' => $c['lng'],
                            'is_active' => true,
                            'source_ref' => 'Government Census 2011',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $id = $existing->id;
                    }
                    $blrCityIds[$c['name']] = $id;
                }

                // Bangalore North Villages
                $bnId = $blrTalukIds['Bangalore North'] ?? null;
                if ($bnId) {
                    $bnVillages = [
                        ['name' => 'Hebbal', 'lat' => 13.0358, 'lng' => 77.5978, 'pin' => '560024'],
                        ['name' => 'Yelahanka', 'lat' => 13.1007, 'lng' => 77.5963, 'pin' => '560064'],
                        ['name' => 'Manyata Tech Park Area', 'lat' => 13.0451, 'lng' => 77.6266, 'pin' => '560045'],
                        ['name' => 'Thanisandra', 'lat' => 13.0547, 'lng' => 77.6326, 'pin' => '560077'],
                    ];
                    foreach ($bnVillages as $v) {
                        $existing = DB::table('location_villages')->where('taluk_id', $bnId)->where('name', $v['name'])->first();
                        if (!$existing) {
                            $vId = DB::table('location_villages')->insertGetId([
                                'taluk_id' => $bnId,
                                'name' => $v['name'],
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'source_ref' => 'Government Census 2011',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            $vId = $existing->id;
                        }

                        // Seed Pincode
                        $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                        if (!$existingPin) {
                            DB::table('location_pincodes')->insert([
                                'pincode' => $v['pin'],
                                'village_id' => $vId,
                                'city_id' => $blrCityIds['Bangalore City'] ?? null,
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // Bangalore East Villages
                $beId = $blrTalukIds['Bangalore East'] ?? null;
                if ($beId) {
                    $beVillages = [
                        ['name' => 'Whitefield', 'lat' => 12.9698, 'lng' => 77.7500, 'pin' => '560066'],
                        ['name' => 'Marathahalli', 'lat' => 12.9569, 'lng' => 77.7011, 'pin' => '560037'],
                        ['name' => 'Bellandur', 'lat' => 12.9304, 'lng' => 77.6784, 'pin' => '560103'],
                        ['name' => 'Varthur', 'lat' => 12.9389, 'lng' => 77.7412, 'pin' => '560087'],
                    ];
                    foreach ($beVillages as $v) {
                        $existing = DB::table('location_villages')->where('taluk_id', $beId)->where('name', $v['name'])->first();
                        if (!$existing) {
                            $vId = DB::table('location_villages')->insertGetId([
                                'taluk_id' => $beId,
                                'name' => $v['name'],
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'source_ref' => 'Government Census 2011',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            $vId = $existing->id;
                        }

                        // Seed Pincode
                        $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                        if (!$existingPin) {
                            DB::table('location_pincodes')->insert([
                                'pincode' => $v['pin'],
                                'village_id' => $vId,
                                'city_id' => $blrCityIds['Bangalore City'] ?? null,
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // Bangalore South Villages
                $bsId = $blrTalukIds['Bangalore South'] ?? null;
                if ($bsId) {
                    $bsVillages = [
                        ['name' => 'Electronic City Phase 1', 'lat' => 12.8441, 'lng' => 77.6631, 'pin' => '560100'],
                        ['name' => 'Begur', 'lat' => 12.8727, 'lng' => 77.6253, 'pin' => '560068'],
                        ['name' => 'Hulimavu', 'lat' => 12.8797, 'lng' => 77.5987, 'pin' => '560076'],
                    ];
                    foreach ($bsVillages as $v) {
                        $existing = DB::table('location_villages')->where('taluk_id', $bsId)->where('name', $v['name'])->first();
                        if (!$existing) {
                            $vId = DB::table('location_villages')->insertGetId([
                                'taluk_id' => $bsId,
                                'name' => $v['name'],
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'source_ref' => 'Government Census 2011',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            $vId = $existing->id;
                        }

                        // Seed Pincode
                        $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                        if (!$existingPin) {
                            DB::table('location_pincodes')->insert([
                                'pincode' => $v['pin'],
                                'village_id' => $vId,
                                'city_id' => $blrCityIds['Bangalore City'] ?? null,
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }

            // Mysore Detail
            $mysId = $districtIds['Mysore'] ?? null;
            if ($mysId) {
                // Taluks
                $existingTaluk = DB::table('location_taluks')->where('district_id', $mysId)->where('name', 'Mysore Taluk')->first();
                if (!$existingTaluk) {
                    $mysTalukId = DB::table('location_taluks')->insertGetId([
                        'district_id' => $mysId,
                        'name' => 'Mysore Taluk',
                        'latitude' => 12.2958,
                        'longitude' => 76.6394,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $mysTalukId = $existingTaluk->id;
                }

                // Cities
                $existingCity = DB::table('location_cities')->where('district_id', $mysId)->where('name', 'Mysuru')->first();
                if (!$existingCity) {
                    $mysCityId = DB::table('location_cities')->insertGetId([
                        'district_id' => $mysId,
                        'name' => 'Mysuru',
                        'latitude' => 12.2958,
                        'longitude' => 76.6394,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $mysCityId = $existingCity->id;
                }

                // Villages
                $mysVillages = [
                    ['name' => 'Gokulam', 'lat' => 12.3278, 'lng' => 76.6268, 'pin' => '570002'],
                    ['name' => 'Vijayanagar', 'lat' => 12.3385, 'lng' => 76.6111, 'pin' => '570017'],
                    ['name' => 'Chamundi Hill', 'lat' => 12.2743, 'lng' => 76.6719, 'pin' => '570010'],
                ];
                foreach ($mysVillages as $v) {
                    $existing = DB::table('location_villages')->where('taluk_id', $mysTalukId)->where('name', $v['name'])->first();
                    if (!$existing) {
                        $vId = DB::table('location_villages')->insertGetId([
                            'taluk_id' => $mysTalukId,
                            'name' => $v['name'],
                            'latitude' => $v['lat'],
                            'longitude' => $v['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $vId = $existing->id;
                    }

                    $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                    if (!$existingPin) {
                        DB::table('location_pincodes')->insert([
                            'pincode' => $v['pin'],
                            'village_id' => $vId,
                            'city_id' => $mysCityId,
                            'latitude' => $v['lat'],
                            'longitude' => $v['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            // Dharwad Detail (REQ: Dharwad district, Hubli / Hubballi, Dharwad, common taluks/villages/localities)
            $dwdId = $districtIds['Dharwad'] ?? null;
            if ($dwdId) {
                // Taluks
                $dwdTaluks = [
                    ['name' => 'Hubli', 'lat' => 15.3647, 'lng' => 75.1240],
                    ['name' => 'Dharwad', 'lat' => 15.4589, 'lng' => 75.0078],
                    ['name' => 'Kalghatgi', 'lat' => 15.1843, 'lng' => 74.9663],
                    ['name' => 'Navalgund', 'lat' => 15.5684, 'lng' => 75.3615],
                    ['name' => 'Kundgol', 'lat' => 15.2573, 'lng' => 75.2512],
                ];
                $dwdTalukIds = [];
                foreach ($dwdTaluks as $t) {
                    $existing = DB::table('location_taluks')->where('district_id', $dwdId)->where('name', $t['name'])->first();
                    if (!$existing) {
                        $id = DB::table('location_taluks')->insertGetId([
                            'district_id' => $dwdId,
                            'name' => $t['name'],
                            'latitude' => $t['lat'],
                            'longitude' => $t['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $id = $existing->id;
                    }
                    $dwdTalukIds[$t['name']] = $id;
                }

                // Cities
                $dwdCities = [
                    ['name' => 'Hubballi', 'lat' => 15.3647, 'lng' => 75.1240],
                    ['name' => 'Dharwad City', 'lat' => 15.4589, 'lng' => 75.0078],
                    ['name' => 'Kalghatgi Town', 'lat' => 15.1843, 'lng' => 74.9663],
                    ['name' => 'Navalgund Town', 'lat' => 15.5684, 'lng' => 75.3615],
                ];
                $dwdCityIds = [];
                foreach ($dwdCities as $c) {
                    $existing = DB::table('location_cities')->where('district_id', $dwdId)->where('name', $c['name'])->first();
                    if (!$existing) {
                        $id = DB::table('location_cities')->insertGetId([
                            'district_id' => $dwdId,
                            'name' => $c['name'],
                            'latitude' => $c['lat'],
                            'longitude' => $c['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $id = $existing->id;
                    }
                    $dwdCityIds[$c['name']] = $id;
                }

                // Hubli Villages / Localities
                $hubliTalukId = $dwdTalukIds['Hubli'] ?? null;
                if ($hubliTalukId) {
                    $hubliVillages = [
                        ['name' => 'Gokul Road', 'lat' => 15.3725, 'lng' => 75.1011, 'pin' => '580030'],
                        ['name' => 'Vidyanagar', 'lat' => 15.3589, 'lng' => 75.1325, 'pin' => '580021'],
                        ['name' => 'Keshwapur', 'lat' => 15.3712, 'lng' => 75.1485, 'pin' => '580023'],
                        ['name' => 'Shirur Park', 'lat' => 15.3621, 'lng' => 75.1215, 'pin' => '580021'],
                        ['name' => 'Bairidevarkoppa', 'lat' => 15.3852, 'lng' => 75.1102, 'pin' => '580025'],
                        ['name' => 'Unkal', 'lat' => 15.3912, 'lng' => 75.1189, 'pin' => '580031'],
                    ];
                    foreach ($hubliVillages as $v) {
                        $existing = DB::table('location_villages')->where('taluk_id', $hubliTalukId)->where('name', $v['name'])->first();
                        if (!$existing) {
                            $vId = DB::table('location_villages')->insertGetId([
                                'taluk_id' => $hubliTalukId,
                                'name' => $v['name'],
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            $vId = $existing->id;
                        }

                        $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                        if (!$existingPin) {
                            DB::table('location_pincodes')->insert([
                                'pincode' => $v['pin'],
                                'village_id' => $vId,
                                'city_id' => $dwdCityIds['Hubballi'] ?? null,
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // Dharwad Villages / Localities
                $dharwadTalukId = $dwdTalukIds['Dharwad'] ?? null;
                if ($dharwadTalukId) {
                    $dharwadVillages = [
                        ['name' => 'Saptapur', 'lat' => 15.4621, 'lng' => 74.9925, 'pin' => '580001'],
                        ['name' => 'Nisarga Layout', 'lat' => 15.4752, 'lng' => 75.0112, 'pin' => '580007'],
                        ['name' => 'Malmaddi', 'lat' => 15.4523, 'lng' => 75.0152, 'pin' => '580007'],
                        ['name' => 'Lakamanahalli', 'lat' => 15.4325, 'lng' => 74.9812, 'pin' => '580004'],
                        ['name' => 'Hebballi Village', 'lat' => 15.4812, 'lng' => 75.0845, 'pin' => '580112'],
                        ['name' => 'Narendra', 'lat' => 15.5123, 'lng' => 74.9812, 'pin' => '580005'],
                    ];
                    foreach ($dharwadVillages as $v) {
                        $existing = DB::table('location_villages')->where('taluk_id', $dharwadTalukId)->where('name', $v['name'])->first();
                        if (!$existing) {
                            $vId = DB::table('location_villages')->insertGetId([
                                'taluk_id' => $dharwadTalukId,
                                'name' => $v['name'],
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            $vId = $existing->id;
                        }

                        $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                        if (!$existingPin) {
                            DB::table('location_pincodes')->insert([
                                'pincode' => $v['pin'],
                                'village_id' => $vId,
                                'city_id' => $dwdCityIds['Dharwad City'] ?? null,
                                'latitude' => $v['lat'],
                                'longitude' => $v['lng'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }
            }
        }

        // 3. Maharashtra State Deep Seeding
        $mhId = $stateIds['MH'] ?? null;
        if ($mhId) {
            $districts = [
                ['name' => 'Mumbai Suburban', 'lat' => 19.1278, 'lng' => 72.8471],
                ['name' => 'Pune', 'lat' => 18.5204, 'lng' => 73.8567],
            ];

            $districtIds = [];
            foreach ($districts as $d) {
                $existing = DB::table('location_districts')->where('state_id', $mhId)->where('name', $d['name'])->first();
                if (!$existing) {
                    $id = DB::table('location_districts')->insertGetId([
                        'state_id' => $mhId,
                        'name' => $d['name'],
                        'latitude' => $d['lat'],
                        'longitude' => $d['lng'],
                        'is_active' => true,
                        'source_ref' => 'Government Census 2011',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $id = $existing->id;
                }
                $districtIds[$d['name']] = $id;
            }

            // Mumbai Suburban
            $mumId = $districtIds['Mumbai Suburban'] ?? null;
            if ($mumId) {
                $existingTaluk = DB::table('location_taluks')->where('district_id', $mumId)->where('name', 'Andheri')->first();
                if (!$existingTaluk) {
                    $andheriId = DB::table('location_taluks')->insertGetId([
                        'district_id' => $mumId,
                        'name' => 'Andheri',
                        'latitude' => 19.1136,
                        'longitude' => 72.8697,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $andheriId = $existingTaluk->id;
                }

                $existingCity = DB::table('location_cities')->where('district_id', $mumId)->where('name', 'Mumbai')->first();
                if (!$existingCity) {
                    $mumCityId = DB::table('location_cities')->insertGetId([
                        'district_id' => $mumId,
                        'name' => 'Mumbai',
                        'latitude' => 19.0760,
                        'longitude' => 72.8777,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $mumCityId = $existingCity->id;
                }

                $mumVillages = [
                    ['name' => 'Bandra West', 'lat' => 19.0596, 'lng' => 72.8295, 'pin' => '400050'],
                    ['name' => 'Juhu', 'lat' => 19.1006, 'lng' => 72.8278, 'pin' => '400049'],
                    ['name' => 'Lokhandwala', 'lat' => 19.1308, 'lng' => 72.8292, 'pin' => '400053'],
                ];
                foreach ($mumVillages as $v) {
                    $existing = DB::table('location_villages')->where('taluk_id', $andheriId)->where('name', $v['name'])->first();
                    if (!$existing) {
                        $vId = DB::table('location_villages')->insertGetId([
                            'taluk_id' => $andheriId,
                            'name' => $v['name'],
                            'latitude' => $v['lat'],
                            'longitude' => $v['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $vId = $existing->id;
                    }

                    $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                    if (!$existingPin) {
                        DB::table('location_pincodes')->insert([
                            'pincode' => $v['pin'],
                            'village_id' => $vId,
                            'city_id' => $mumCityId,
                            'latitude' => $v['lat'],
                            'longitude' => $v['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            // Pune Detail
            $puneId = $districtIds['Pune'] ?? null;
            if ($puneId) {
                $existingTaluk = DB::table('location_taluks')->where('district_id', $puneId)->where('name', 'Haveli')->first();
                if (!$existingTaluk) {
                    $haveliId = DB::table('location_taluks')->insertGetId([
                        'district_id' => $puneId,
                        'name' => 'Haveli',
                        'latitude' => 18.5204,
                        'longitude' => 73.8567,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $haveliId = $existingTaluk->id;
                }

                $existingCity = DB::table('location_cities')->where('district_id', $puneId)->where('name', 'Pune')->first();
                if (!$existingCity) {
                    $puneCityId = DB::table('location_cities')->insertGetId([
                        'district_id' => $puneId,
                        'name' => 'Pune',
                        'latitude' => 18.5204,
                        'longitude' => 73.8567,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $puneCityId = $existingCity->id;
                }

                $puneVillages = [
                    ['name' => 'Hinjawadi', 'lat' => 18.5913, 'lng' => 73.7389, 'pin' => '411057'],
                    ['name' => 'Baner', 'lat' => 18.5590, 'lng' => 73.7925, 'pin' => '411045'],
                    ['name' => 'Hadapsar', 'lat' => 18.5089, 'lng' => 73.9259, 'pin' => '411028'],
                ];
                foreach ($puneVillages as $v) {
                    $existing = DB::table('location_villages')->where('taluk_id', $haveliId)->where('name', $v['name'])->first();
                    if (!$existing) {
                        $vId = DB::table('location_villages')->insertGetId([
                            'taluk_id' => $haveliId,
                            'name' => $v['name'],
                            'latitude' => $v['lat'],
                            'longitude' => $v['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $vId = $existing->id;
                    }

                    $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                    if (!$existingPin) {
                        DB::table('location_pincodes')->insert([
                            'pincode' => $v['pin'],
                            'village_id' => $vId,
                            'city_id' => $puneCityId,
                            'latitude' => $v['lat'],
                            'longitude' => $v['lng'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }

        // 4. Haryana State Deep Seeding
        $hrId = $stateIds['HR'] ?? null;
        if ($hrId) {
            $existingDist = DB::table('location_districts')->where('state_id', $hrId)->where('name', 'Gurgaon')->first();
            if (!$existingDist) {
                $gurgaonId = DB::table('location_districts')->insertGetId([
                    'state_id' => $hrId,
                    'name' => 'Gurgaon',
                    'latitude' => 28.4595,
                    'longitude' => 77.0266,
                    'is_active' => true,
                    'source_ref' => 'Government Census 2011',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $gurgaonId = $existingDist->id;
            }

            $existingTaluk = DB::table('location_taluks')->where('district_id', $gurgaonId)->where('name', 'Gurgaon Taluk')->first();
            if (!$existingTaluk) {
                $gurgaonTalukId = DB::table('location_taluks')->insertGetId([
                    'district_id' => $gurgaonId,
                    'name' => 'Gurgaon Taluk',
                    'latitude' => 28.4595,
                    'longitude' => 77.0266,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $gurgaonTalukId = $existingTaluk->id;
            }

            $existingCity = DB::table('location_cities')->where('district_id', $gurgaonId)->where('name', 'Gurugram')->first();
            if (!$existingCity) {
                $gurgaonCityId = DB::table('location_cities')->insertGetId([
                    'district_id' => $gurgaonId,
                    'name' => 'Gurugram',
                    'latitude' => 28.4595,
                    'longitude' => 77.0266,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $gurgaonCityId = $existingCity->id;
            }

            $hrVillages = [
                ['name' => 'Sector 15', 'lat' => 28.4682, 'lng' => 77.0366, 'pin' => '122001'],
                ['name' => 'Sector 45', 'lat' => 28.4352, 'lng' => 77.0626, 'pin' => '122003'],
                ['name' => 'Sohna', 'lat' => 28.2492, 'lng' => 77.0682, 'pin' => '122103'],
            ];
            foreach ($hrVillages as $v) {
                $existing = DB::table('location_villages')->where('taluk_id', $gurgaonTalukId)->where('name', $v['name'])->first();
                if (!$existing) {
                    $vId = DB::table('location_villages')->insertGetId([
                        'taluk_id' => $gurgaonTalukId,
                        'name' => $v['name'],
                        'latitude' => $v['lat'],
                        'longitude' => $v['lng'],
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $vId = $existing->id;
                }

                $existingPin = DB::table('location_pincodes')->where('village_id', $vId)->where('pincode', $v['pin'])->first();
                if (!$existingPin) {
                    DB::table('location_pincodes')->insert([
                        'pincode' => $v['pin'],
                        'village_id' => $vId,
                        'city_id' => $gurgaonCityId,
                        'latitude' => $v['lat'],
                        'longitude' => $v['lng'],
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
