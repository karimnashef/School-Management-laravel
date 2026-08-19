<?php

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\AcademicYear;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AcademicYearService
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return AcademicYear::query()
            ->orderByDesc('start_date')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): AcademicYear
    {
        if ($data['is_current'] ?? false) {
            $this->clearCurrentFlag();
        }

        return AcademicYear::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(AcademicYear $year, array $data): AcademicYear
    {
        $year->update($data);

        return $year;
    }

    public function setCurrent(AcademicYear $year): AcademicYear
    {
        DB::transaction(function () use ($year): void {
            AcademicYear::query()->update(['is_current' => false]);
            $year->update(['is_current' => true]);
        });

        return $year->refresh();
    }

    public function delete(AcademicYear $year): void
    {
        $year->delete();
    }

    private function clearCurrentFlag(): void
    {
        AcademicYear::query()->update(['is_current' => false]);
    }
}